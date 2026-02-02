import { useState, useEffect, useRef } from 'react';
import { Send, X, Wifi, WifiOff, Users } from 'lucide-react';
import NotificationToast from "./NotificationToast.tsx";

// Интерфейс для описания структуры сообщения оператора
interface Message {
  client_id: string;      // ID клиента, с которым связано сообщение
  message: string;        // Текст сообщения
  timestamp: Date;        // Время отправки
  fromOperator: boolean;  // Флаг: отправлено ли сообщение оператором (true) или получено от клиента (false)
}

// Тип для хранения сообщений: ключ - ID клиента, значение - массив сообщений
interface ClientMessages {
  [client_id: string]: Message[];
}

// Пропсы для компонента панели оператора
interface OperatorPanelProps {
  isOpen: boolean;      // Открыта ли панель
  onClose: () => void;  // Функция для закрытия панели
}

// Компонент панели оператора (для общения с несколькими клиентами)
export function OperatorWS({ isOpen, onClose }: OperatorPanelProps) {
  // Состояние: объект, где для каждого клиента хранится массив сообщений
  // Структура: { "bob": [сообщения с bob], "alice": [сообщения с alice] }
  const [messages, setMessages] = useState<ClientMessages>({});

  // Состояние: текущее значение в поле ввода
  const [inputValue, setInputValue] = useState('');

  // Состояние: подключен ли WebSocket
  const [isConnected, setIsConnected] = useState(false);

  // Состояние: ID клиента, с которым сейчас ведется переписка (выбран в списке)
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Состояние: объект WebSocket соединения
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Состояние: имя оператора (вводится при входе)
  const [operatorName, setOperatorName] = useState('');

  // Состояние: вошел ли оператор (прошел форму входа)
  const [hasJoined, setHasJoined] = useState(false);

  const [notifyConnect, setNotifyConnect] = useState(null)

  // Реф для автоматической прокрутки к последнему сообщению
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Функция для прокрутки к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Эффект: автоматически прокручиваем вниз при изменении сообщений или выбранного клиента
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedClient]);

  // Эффект: управление подключением при открытии/закрытии панели
  useEffect(() => {
    if (!isOpen) {
      // Если панель закрывается и есть соединение - отключаемся и очищаем состояния
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
    }
  }, [isOpen]);

  // Функция для подключения оператора к WebSocket (вызывается при отправке формы входа)
  const connectAsOperator = () => {
    // Проверяем, что имя оператора не пустое
    if (!operatorName.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

    // Подключаемся к эндпоинту оператора
    const websocket = new WebSocket(`ws://localhost:8000/operator/${operatorName}`);

    // Обработчик события: соединение установлено
    websocket.onopen = () => {
      console.log('Оператор подключен');
      setIsConnected(true);
      setHasJoined(true);  // Показываем интерфейс панели оператора
    };

    // Обработчик события: получено сообщение от сервера
    websocket.onmessage = (event) => {
      try {
        // Оператор получает JSON с информацией о клиенте и его сообщении
        const data = JSON.parse(event.data);
        if (data.type === 'notify_to_connection') {
          setNotifyConnect({
            message: `Клиент ${data.client_id} подключился к чату`,
            type: 'Notify to connection',
            client_id: data.client_id,
            timestamp: new Date(),
          })
        }
        // Проверяем что есть client_id и message (это сообщение от клиента)
        if (data.client_id && data.message) {
          // Создаем объект сообщения
          const newMessage: Message = {
            client_id: data.client_id,  // От кого пришло
            message: data.message,       // Текст
            timestamp: new Date(),       // Текущее время
            fromOperator: false          // Это сообщение ОТ клиента (не от оператора)
          };


          // Добавляем сообщение в историю конкретного клиента
          setMessages(prev => ({
            ...prev,  // Сохраняем все предыдущие чаты
            [data.client_id]: [...(prev[data.client_id] || []), newMessage]  // Добавляем новое сообщение к истории клиента
          }));

          // Если не выбран никакой клиент, автоматически выбираем того, кто написал
          if (!selectedClient) {
            setSelectedClient(data.client_id);
          }
        }
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
      }
    };

    // Обработчик события: произошла ошибка WebSocket
    websocket.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
      setIsConnected(false);
    };

    // Обработчик события: соединение закрыто
    websocket.onclose = () => {
      console.log('WebSocket оператора отключен');
      setIsConnected(false);
    };

    // Сохраняем объект WebSocket в состоянии
    setWs(websocket);
  };

  // Функция для отправки сообщения клиенту
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();  // Предотвращаем перезагрузку страницы

    // Проверяем все условия перед отправкой
    if (!inputValue.trim() || !ws || !isConnected || !selectedClient) return;

    // Формируем JSON для отправки оператором
    // Бэкенд ожидает: { target_client_id: string, message: string }
    const messageData = {
      client_id: selectedClient,  // Кому отправляем
      message: inputValue,                // Текст сообщения
      type: "operator_message"
    };

    // Отправляем JSON на сервер
    ws.send(JSON.stringify(messageData));
    // Добавляем сообщение в локальную историю (для отображения справа)
    const newMessage: Message = {
      client_id: selectedClient,  // С каким клиентом связано
      message: inputValue,        // Текст
      timestamp: new Date(),      // Время отправки
      fromOperator: true          // Это сообщение ОТ оператора
    };

    // Добавляем сообщение в историю выбранного клиента
    setMessages(prev => ({
      ...prev,
      [selectedClient]: [...(prev[selectedClient] || []), newMessage]
    }));

    // Очищаем поле ввода
    setInputValue('');
  };

  // Получаем список всех client_id (ключи объекта messages)
  const clientList = Object.keys(messages);

  // Получаем массив сообщений с текущим выбранным клиентом
  const currentMessages = selectedClient ? messages[selectedClient] || [] : [];

  // Если панель закрыта, не рендерим ничего
  if (!isOpen) return null;

  return (
    // Оверлей на весь экран с затемнением
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Основной контейнер панели оператора (широкий, с боковой панелью) */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] flex overflow-hidden">

        {/* Условный рендеринг: форма входа ИЛИ интерфейс панели оператора */}
        {!hasJoined ? (
          // ФОРМА ВХОДА (показывается до подключения)
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              {/* Приветственный текст */}
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

              {/* Форма ввода имени оператора */}
              <form onSubmit={(e) => {
                e.preventDefault();
                connectAsOperator();  // При отправке подключаемся
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
          // ИНТЕРФЕЙС ПАНЕЛИ ОПЕРАТОРА (показывается после входа)
          <>
        {notifyConnect && (
              <NotificationToast
                notification={notifyConnect}
                onClose={() => setNotifyConnect(null)} // ← Вот что передать в onClose
              />
      )}
        {/* БОКОВАЯ ПАНЕЛЬ - список клиентов */}
        <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Шапка боковой панели */}

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <h3 className="font-semibold">Панель оператора</h3>
            </div>
            {/* Индикатор подключения */}
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Онлайн</span>
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
            {clientList.length === 0 ? (
              // Пустое состояние (нет клиентов)
              <div className="text-center text-gray-400 mt-8 px-4">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет активных клиентов</p>
              </div>
            ) : (
              // Список карточек клиентов
              <div className="space-y-1">
                {clientList.map((client_id) => {
                  // Получаем все сообщения для этого клиента
                  const clientMessages = messages[client_id] || [];

                  // Получаем последнее сообщение для превью
                  const lastMessage = clientMessages[clientMessages.length - 1];

                  // Считаем количество непрочитанных (все сообщения ОТ клиента)
                  const unreadCount = clientMessages.filter(m => !m.fromOperator).length;

                  return (
                    <button
                      key={client_id}
                      onClick={() => setSelectedClient(client_id)}  // При клике выбираем этого клиента
                      // Разные стили для выбранного и невыбранного клиента
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedClient === client_id
                          ? 'bg-purple-100 border-2 border-purple-500'  // Выбранный
                          : 'bg-white hover:bg-gray-100 border-2 border-transparent'  // Невыбранный
                      }`}
                    >
                      {/* Верхняя строка: имя клиента и бейдж с количеством сообщений */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 truncate">
                          {client_id}
                        </span>
                        {/* Показываем бейдж только если есть непрочитанные */}
                        {unreadCount > 0 && (
                          <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {/* Превью последнего сообщения */}
                      {lastMessage && (
                        <p className="text-xs text-gray-500 truncate">
                          {lastMessage.fromOperator ? 'Вы: ' : ''}  {/* Если от оператора, добавляем "Вы:" */}
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
          {notifyConnect ? <div>COnnect</div> : ''}
          {/* Header основной области */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div>
              {selectedClient ? (
                // Если выбран клиент, показываем его имя
                <>
                  <h2 className="font-semibold text-lg text-gray-800">
                    Чат с {selectedClient}
                  </h2>
                  <p className="text-sm text-gray-500">Активен</p>
                </>
              ) : (
                // Если не выбран клиент
                <h2 className="font-semibold text-lg text-gray-400">
                  Выберите клиента
                </h2>
              )}
            </div>
            {/* Кнопка закрытия панели */}
            <button
              onClick={onClose}
              className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {!selectedClient ? (
              // Не выбран клиент
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">👈</div>
                  <p>Выберите клиента из списка</p>
                </div>
              </div>
            ) : currentMessages.length === 0 ? (
              // Выбран клиент, но нет сообщений с ним
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Нет сообщений</p>
                </div>
              </div>
            ) : (
              // Есть сообщения - отображаем их
              currentMessages.map((message, index) => (
                <div
                  key={index}
                  // Сообщения оператора справа, клиента слева
                  className={`flex ${message.fromOperator ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    // Разные стили для сообщений оператора и клиента
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.fromOperator
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm'  // Оператор: фиолетовый
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'  // Клиент: белый
                    }`}
                  >
                    {/* Текст сообщения */}
                    <div className="break-words">{message.message}</div>
                    {/* Время отправки */}
                    <div className={`text-xs mt-1 ${message.fromOperator ? 'text-purple-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* Невидимый div для автоматической прокрутки */}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода сообщения */}
          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              {/* Текстовое поле */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedClient ? "Напишите сообщение..." : "Выберите клиента"}
                disabled={!isConnected || !selectedClient}  // Отключаем если нет соединения или не выбран клиент
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
              />
              {/* Кнопка отправки */}
              <button
                type="submit"
                disabled={!isConnected || !selectedClient || !inputValue.trim()}  // Отключаем при недоступности
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
          </>
        )}
      </div>
    </div>
  );
}