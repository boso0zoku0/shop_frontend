import {useState, useEffect, useRef} from 'react';
import {Users, Wifi, WifiOff, Send, X, UserCircle2, Clock} from 'lucide-react';
import axios from 'axios';

interface Message {
  client: string;
  message: string;
  timestamp: Date;
  fromOperator: boolean;
}

interface ClientMessages {
  [client: string]: Message[];
}

interface OperatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Компонент для красивого отображения сообщения
const OperatorMessageBubble = ({message}: { message: Message }) => {
  if (message.fromOperator) {
    // Сообщение от оператора (справа)
    return (
      <div className="flex justify-end mb-3">
        <div className="flex items-end gap-2 max-w-[70%]">
          <div>
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-md">
              <div className="break-words">{message.message}</div>
              <div className="text-xs mt-1.5 text-purple-100 opacity-75 flex items-center gap-1">
                <Clock className="w-3 h-3"/>
                {message.timestamp.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          <div className="bg-purple-100 p-2 rounded-full mb-1 flex-shrink-0">
            <UserCircle2 className="w-5 h-5 text-purple-700"/>
          </div>
        </div>
      </div>
    );
  } else {
    // Сообщение от клиента (слева)
    return (
      <div className="flex justify-start mb-3">
        <div className="flex items-end gap-2 max-w-[70%]">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-full mb-1 flex-shrink-0">
            <UserCircle2 className="w-5 h-5 text-white"/>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 ml-1">
              {message.client}
            </div>
            <div
              className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-md border border-gray-100">
              <div className="break-words">{message.message}</div>
              <div className="text-xs mt-1.5 text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3"/>
                {message.timestamp.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export function OperatorWS({isOpen, onClose}: OperatorPanelProps) {
  const [messages, setMessages] = useState<ClientMessages>({});
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (ws && isConnected && allClients.length > 0 && !selectedClient) {
      const firstClient = allClients[0];
      setSelectedClient(firstClient);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          from: operatorName,
          to: firstClient,
          message: "Оператор подключился",
          type: "operator_message"
        }));
      }
    }
  }, [ws, isConnected]);

  useEffect(() => {
    if (isOpen && hasJoined) {
      loadClients();
      const interval = setInterval(loadClients, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, hasJoined]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedClient]);

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

  const connectAsOperator = () => {
    if (!operatorName.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

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

          if (!selectedClient) {
            setSelectedClient(data.from);
          }

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

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !ws || !isConnected || !selectedClient) {
      console.warn('Не все условия выполнены для отправки');
      return;
    }

    const messageData = {
      from: operatorName,
      to: selectedClient,
      message: inputValue,
      type: "operator_message"
    };

    console.log('Отправка сообщения:', messageData);
    ws.send(JSON.stringify(messageData));

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

  const clientsWithMessages = Object.keys(messages);
  const allClients = Array.from(new Set([...availableClients, ...clientsWithMessages]));
  const currentMessages = selectedClient ? messages[selectedClient] || [] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] flex overflow-hidden">

        {!hasJoined ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="text-center mb-6">
                <div className="inline-block bg-purple-100 p-4 rounded-full mb-4">
                  <Users className="w-8 h-8 text-purple-600"/>
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
          <>
            {/* БОКОВАЯ ПАНЕЛЬ */}
            <div className="w-72 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5"/>
                  <h3 className="font-semibold">Панель оператора</h3>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4"/>
                      <span>Онлайн ({operatorName})</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4"/>
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
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50"/>
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
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            selectedClient === client
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400 shadow-md'
                              : 'bg-white hover:bg-gray-50 border-2 border-transparent hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-full">
                              <UserCircle2 className="w-4 h-4 text-white"/>
                            </div>
                            <span className="font-semibold text-gray-800 truncate flex-1">
                              {client}
                            </span>
                            {unreadCount > 0 && (
                              <span
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-gray-500 truncate ml-9">
                              {lastMessage.fromOperator ? '✓ Вы: ' : ''}
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
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
                <div>
                  {selectedClient ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                          <UserCircle2 className="w-5 h-5"/>
                        </div>
                        <div>
                          <h3 className="font-semibold">Чат с {selectedClient}</h3>
                          <p className="text-sm opacity-90">
                            {currentMessages.length} сообщений
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <h3 className="font-semibold">Выберите клиента</h3>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Область сообщений */}
              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100">
                {!selectedClient ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Users className="w-16 h-16 mx-auto mb-3 opacity-50"/>
                      <p className="text-lg font-medium">Выберите клиента</p>
                      <p className="text-sm mt-1">из списка слева</p>
                    </div>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">Начните переписку</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentMessages.map((msg, idx) => (
                      <OperatorMessageBubble key={idx} message={msg}/>
                    ))}
                    <div ref={messagesEndRef}/>
                  </>
                )}
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                      disabled={!isConnected}
                    />
                    <button
                      type="submit"
                      disabled={!isConnected || !inputValue.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Send className="w-5 h-5"/>
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