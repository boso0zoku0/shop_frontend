import {useState, useEffect, useRef} from 'react';
import {Send, X, Wifi, WifiOff, User} from 'lucide-react';
import axios from "axios";

// Интерфейс для описания структуры сообщения
interface Message {
  id: string;           // Уникальный идентификатор сообщения
  message: string;         // Текст сообщения
  username: string;     // Имя отправителя
  timestamp: Date;      // Время отправки
  isOwn: boolean;       // Флаг: отправлено ли сообщение текущим пользователем
}

// Пропсы для компонента окна чата
interface ChatWindowProps {
  isOpen: boolean;      // Открыто ли окно чата
  onClose: () => void;  // Функция для закрытия окна
}

// Компонент окна чата для клиента
export function ClientsWS({isOpen, onClose}: ChatWindowProps) {
  // Состояние: массив всех сообщений в чате
  const [messages, setMessages] = useState<Message[]>([]);

  // Состояние: текущее значение в поле ввода
  const [inputValue, setInputValue] = useState('');

  // Состояние: имя пользователя (вводится при входе)
  const [username, setUsername] = useState('');

  // Состояние: подключен ли WebSocket
  const [isConnected, setIsConnected] = useState(false);

  // Состояние: вошел ли пользователь в чат (прошел форму входа)
  const [hasJoined, setHasJoined] = useState(false);

  // Состояние: объект WebSocket соединения
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Реф для автоматической прокрутки к последнему сообщению
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Функция для прокрутки к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  // Эффект: автоматически прокручиваем вниз при появлении новых сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Эффект: очищаем состояние и закрываем соединение при закрытии окна
  useEffect(() => {
    if (!isOpen) {
      // Закрываем WebSocket при закрытии окна
      if (ws) {
        ws.close();
        setWs(null);
      }
      // Сбрасываем все состояния
      setIsConnected(false);
      setHasJoined(false);
      setMessages([]);
      setUsername('');
      setInputValue('');
    }
  }, [isOpen]);

  async function userByCookie() {
    const session_id = localStorage.getItem('cookie_session_id');
    if (!session_id) {
      alert('Please login first');
      return null;
    }

    // Устанавливаем куку перед запросом
    document.cookie = `session_id=${session_id}; path=/; SameSite=Lax`;

    try {
      const response = await axios.get(
        'http://127.0.0.1:8000/auth/user-by-cookie',
        {
          withCredentials: true
        },

      );

      return response.data.username;

    } catch (error) {
      console.error('Axios error:', error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
      return null;
    }
  }

  // Функция для подключения к чату (вызывается при отправке формы входа)
  const connectToChat = async () => {
      // Проверяем, что имя пользователя не пустое
      if (!username.trim()) {
        alert('Пожалуйста, введите имя пользователя');
        return;
      }

      const client_id = await userByCookie()
      console.log('User:', username);
      const websocket = new WebSocket(`ws://localhost:8000/clients/${client_id}`);

      // Обработчик события: соединение установлено
      websocket.onopen = () => {
        console.log('WebSocket подключен');
        setIsConnected(true);  // Устанавливаем флаг подключения
        setHasJoined(true);    // Показываем интерфейс чата
      };

      // Обработчик события: получено сообщение от сервера
      websocket.onmessage = (event) => {
        try {
          // Клиент получает JSON от оператора
          const data = JSON.parse(event.data);

          // Проверяем тип сообщения от оператора
          if (data.type === "operator_message") {
            // Создаем объект сообщения для отображения
            const newMessage: Message = {
              id: Date.now().toString() + Math.random(),  // Генерируем уникальный ID
              message: data.message,                          // Текст от оператора
              username: 'Оператор',                        // Отправитель - оператор
              timestamp: new Date(),                       // Текущее время
              isOwn: false                                 // Это не наше сообщение
            };

            // Добавляем сообщение в массив сообщений
            setMessages(prev => [...prev, newMessage]);
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
        console.log('WebSocket отключен');
        setIsConnected(false);
      };

      // Сохраняем объект WebSocket в состоянии
      setWs(websocket);
    }
  ;

  // Функция для отправки сообщения оператору
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();  // Предотвращаем перезагрузку страницы

    // Проверяем все условия перед отправкой
    if (!inputValue.trim() || !ws || !isConnected) return;

    // Клиент отправляет простой текст (не JSON)
    // Бэкенд получит это в методе websocket.receive_text()
    ws.send(inputValue);

    // Добавляем наше собственное сообщение в список (для отображения справа)
    const ownMessage: Message = {
      id: Date.now().toString() + Math.random(),  // Генерируем уникальный ID
      message: inputValue,                           // Текст который мы ввели
      username: username,                         // Наше имя
      timestamp: new Date(),                      // Текущее время
      isOwn: true                                 // Это наше сообщение
    };

    // Добавляем сообщение в массив
    setMessages(prev => [...prev, ownMessage]);

    // Очищаем поле ввода
    setInputValue('');
  };

  // Если окно закрыто, не рендерим ничего
  if (!isOpen) return null;

  return (
    // Оверлей на весь экран с затемнением
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Основной контейнер окна чата */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Шапка чата */}
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Иконка чата */}
            <div className="bg-white/20 p-2 rounded-lg">
              💬
            </div>
            <div>
              <h2 className="font-semibold text-lg">Чат</h2>
              {/* Индикатор подключения */}
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4"/>
                    <span>Подключено</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4"/>
                    <span>Не подключено</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Кнопка закрытия окна */}
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* Условный рендеринг: форма входа ИЛИ интерфейс чата */}
        {!hasJoined ? (
          // ФОРМА ВХОДА (показывается до подключения)
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              {/* Приветственный текст */}
              <div className="text-center mb-6">
                <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
                  <User className="w-8 h-8 text-blue-600"/>
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  Добро пожаловать!
                </h3>
                <p className="text-gray-600">
                  Введите ваше имя для входа в чат
                </p>
              </div>

              {/* Форма ввода имени пользователя */}
              <form onSubmit={(e) => {
                e.preventDefault();
                connectToChat();  // При отправке подключаемся к чату
              }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Войти в чат
                </button>
              </form>
            </div>
          </div>
        ) : (
          // ИНТЕРФЕЙС ЧАТА (показывается после входа)
          <>
            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                // Пустое состояние (нет сообщений)
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Сообщений пока нет</p>
                    <p className="text-sm">Начните разговор!</p>
                  </div>
                </div>
              ) : (
                // Список сообщений
                messages.map((message) => (
                  <div
                    key={message.id}
                    // Свои сообщения справа, чужие слева
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      // Разные стили для своих и чужих сообщений
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.isOwn
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'  // Свои: синий фон
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'  // Чужие: белый фон
                      }`}
                    >
                      {/* Имя отправителя (только для чужих сообщений) */}
                      {!message.isOwn && (
                        <div className="text-xs font-semibold mb-1 opacity-70">
                          {message.username}
                        </div>
                      )}
                      {/* Текст сообщения */}
                      <div className="break-words">{message.message}</div>
                      {/* Время отправки */}
                      <div className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
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
              <div ref={messagesEndRef}/>
            </div>

            {/* Поле ввода сообщения */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                {/* Текстовое поле */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Напишите сообщение..."
                  disabled={!isConnected}  // Отключаем если нет соединения
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                />
                {/* Кнопка отправки */}
                <button
                  type="submit"
                  disabled={!isConnected || !inputValue.trim()}  // Отключаем если нет соединения или пустое поле
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5"/>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}