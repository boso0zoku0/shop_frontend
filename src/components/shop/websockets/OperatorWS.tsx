import { useState, useEffect, useRef } from 'react';
import { Users, Wifi, WifiOff, Send, X } from 'lucide-react';
import axios from 'axios';

// Интерфейс для описания структуры сообщения оператора
interface Message {
  client: string;      // ID клиента, с которым связано сообщение
  message: string;     // Текст сообщения
  timestamp: Date;     // Время отправки
  fromOperator: boolean;  // Флаг: отправлено ли сообщение оператором
}

// Тип для хранения сообщений: ключ - ID клиента, значение - массив сообщений
interface ClientMessages {
  [client: string]: Message[];
}

// Пропсы для компонента панели оператора
interface OperatorPanelProps {
  isOpen: boolean;      // Открыта ли панель
  onClose: () => void;  // Функция для закрытия панели
}

// Компонент панели оператора (для общения с несколькими клиентами)
export function OperatorWS({ isOpen, onClose }: OperatorPanelProps) {
  const [messages, setMessages] = useState<ClientMessages>({});
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  // ✅ ИСПРАВЛЕНО: Правильная типизация для списка клиентов
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ ИСПРАВЛЕНО: Функция загрузки списка клиентов
  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await axios.get("http://localhost:8000/get-clients");
      console.log('Получены клиенты:', response.data);
      setAvailableClients(response.data);
    } catch (error) {
      console.error("Ошибка получения клиентов:", error);
      setAvailableClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // ✅ ИСПРАВЛЕНО: Загружаем клиентов при открытии панели
  useEffect(() => {
    if (isOpen && hasJoined) {
      loadClients();
      // Обновляем список каждые 5 секунд
      const interval = setInterval(loadClients, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, hasJoined]);

  // Функция для прокрутки к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedClient]);

  // Эффект: управление подключением при открытии/закрытии панели
  useEffect(() => {
    if (!isOpen) {
      if (ws) {
        ws.close();
        setWs(null);
      }
      setIsConnected(false);
      setHasJoined(false);
      setMessages({});
      setSelectedClient(null);
      setOperatorName('');
      setInputValue('');
      setAvailableClients([]);
    }
  }, [isOpen]);

  // ✅ ИСПРАВЛЕНО: Подключаемся БЕЗ указания клиента в URL
  const connectAsOperator = () => {
    if (!operatorName.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

    // Подключаемся к эндпоинту оператора БЕЗ клиента в URL
    const websocket = new WebSocket(`ws://localhost:8000/operator/${operatorName}`);

    websocket.onopen = () => {
      console.log('✓ Оператор подключен');
      setIsConnected(true);
      setHasJoined(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Получено сообщение:', data);

        // Если это сообщение от клиента
        if (data.type === "client_message" && data.from && data.message) {
          const newMessage: Message = {
            client: data.from,
            message: data.message,
            timestamp: new Date(),
            fromOperator: false
          };

          setMessages(prev => ({
            ...prev,
            [data.from]: [...(prev[data.from] || []), newMessage]
          }));

          // Автоматически выбираем клиента если не выбран
          if (!selectedClient) {
            setSelectedClient(data.from);
          }

          // Обновляем список клиентов
          loadClients();
        }
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket оператора отключен');
      setIsConnected(false);
    };
  };

  // ✅ ИСПРАВЛЕНО: Отправка сообщения с указанием получателя
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !ws || !isConnected || !selectedClient) {
      console.warn('Не все условия выполнены для отправки');
      return;
    }

    // Формируем JSON с указанием получателя (to)
    const messageData = {
      from: operatorName,
      to: selectedClient,           // ← ВАЖНО: "to" вместо "client"
      message: inputValue,
      type: "operator_message"
    };

    console.log('Отправка сообщения:', messageData);
    ws.send(JSON.stringify(messageData));

    // Добавляем в локальную историю
    const newMessage: Message = {
      client: selectedClient,
      message: inputValue,
      timestamp: new Date(),
      fromOperator: true
    };

    setMessages(prev => ({
      ...prev,
      [selectedClient]: [...(prev[selectedClient] || []), newMessage]
    }));

    setInputValue('');
  };

  // Получаем список клиентов из messages (с кем уже была переписка)
  const clientsWithMessages = Object.keys(messages);

  // Объединяем списки: клиенты из API + клиенты с которыми уже общались
  const allClients = Array.from(new Set([...availableClients, ...clientsWithMessages]));

  // Получаем массив сообщений с текущим выбранным клиентом
  const currentMessages = selectedClient ? messages[selectedClient] || [] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] flex overflow-hidden">

        {!hasJoined ? (
          // ФОРМА ВХОДА
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="text-center mb-6">
                <div className="inline-block bg-purple-100 p-4 rounded-full mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  Панель оператора
                </h3>
                <p className="text-gray-600">
                  Введите ваше имя для входа в систему
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                connectAsOperator();
              }}>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Войти как оператор
                </button>
              </form>
            </div>
          </div>
        ) : (
          // ИНТЕРФЕЙС ПАНЕЛИ ОПЕРАТОРА
          <>
            {/* БОКОВАЯ ПАНЕЛЬ - список клиентов */}
            <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" />
                  <h3 className="font-semibold">Панель оператора</h3>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>Онлайн ({operatorName})</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>Оффлайн</span>
                    </>
                  )}
                </div>
              </div>

              {/* Список клиентов */}
              <div className="flex-1 overflow-y-auto p-2">
                {isLoadingClients && allClients.length === 0 ? (
                  <div className="text-center text-gray-400 mt-4">
                    <p className="text-sm">Загрузка клиентов...</p>
                  </div>
                ) : allClients.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8 px-4">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Нет активных клиентов</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {allClients.map((client) => {
                      const clientMessages = messages[client] || [];
                      const lastMessage = clientMessages[clientMessages.length - 1];
                      const unreadCount = clientMessages.filter(m => !m.fromOperator).length;

                      return (
                        <button
                          key={client}
                          onClick={() => setSelectedClient(client)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedClient === client
                              ? 'bg-purple-100 border-2 border-purple-500'
                              : 'bg-white hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-800 truncate">
                              {client}
                            </span>
                            {unreadCount > 0 && (
                              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-gray-500 truncate">
                              {lastMessage.fromOperator ? 'Вы: ' : ''}
                              {lastMessage.message}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ОСНОВНАЯ ОБЛАСТЬ ЧАТА */}
            <div className="flex-1 flex flex-col">
              {/* Шапка чата */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
                <div>
                  {selectedClient ? (
                    <>
                      <h3 className="font-semibold">Чат с {selectedClient}</h3>
                      <p className="text-sm opacity-90">
                        {currentMessages.length} сообщений
                      </p>
                    </>
                  ) : (
                    <h3 className="font-semibold">Выберите клиента</h3>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Область сообщений */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {!selectedClient ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p>Выберите клиента из списка слева</p>
                    </div>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p>Нет сообщений</p>
                      <p className="text-sm mt-1">Начните переписку</p>
                    </div>
                  </div>
                ) : (
                  currentMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.fromOperator ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.fromOperator
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.fromOperator ? 'text-purple-100' : 'text-gray-400'
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Форма отправки */}
              <div className="bg-white border-t border-gray-200 p-4">
                {!selectedClient ? (
                  <div className="text-center text-gray-400 py-2">
                    Выберите клиента для отправки сообщения
                  </div>
                ) : (
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={`Сообщение для ${selectedClient}...`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                      disabled={!isConnected}
                    />
                    <button
                      type="submit"
                      disabled={!isConnected || !inputValue.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
