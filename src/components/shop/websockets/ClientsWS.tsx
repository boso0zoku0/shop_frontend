import {useState, useEffect, useRef} from 'react';
import {Send, X, Wifi, WifiOff, User} from 'lucide-react';
import axios from 'axios';
import {getSessionId, setSessionCookie} from '../cookieHelper';
import {ChatBubbleBottomCenterTextIcon} from '@heroicons/react/24/solid'

interface Message {
  id: string;
  message: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
  isButton: boolean
}

interface ClientPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientsWS({isOpen, onClose}: ClientPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [msgReply, setMsgReply] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const operator = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen && ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      setMessages([]);
      setIsLoggedIn(false);
      setUsername('');
    }
  }, [isOpen]);

  // Функция для получения username по cookie
  async function userByCookie() {
    const session_id = getSessionId();
    if (!session_id) {
      alert('Please login first');
      return null;
    }

    // ВАЖНО: Устанавливаем куку перед запросом
    // Браузер автоматически отправит её с запросом благодаря withCredentials: true
    setSessionCookie(session_id);

    try {
      const response = await axios.get(
        'http://localhost:8000/auth/user-by-cookie',  // Изменено с 127.0.0.1 на localhost!
        {
          withCredentials: true,  // Браузер отправит куки автоматически
        }
      );

      return response.data.username;

    } catch (error: any) {
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

    const client = await userByCookie();
    if (!client) {
      alert('Не удалось получить данные пользователя');
      return;
    }

    console.log('User:', client);
    const websocket = new WebSocket(`ws://localhost:8000/clients/${client}`);

    // Обработчик события: соединение установлено
    websocket.onopen = () => {
      console.log('✓ WebSocket подключен');
      setIsConnected(true);
      setHasJoined(true);
      setIsLoggedIn(true)
    };

    // Обработчик события: получено сообщение от сервера
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Получено сообщение:', data);

        // ✅ Обрабатываем разные типы сообщений
        if (data.type === "operator_message") {
          // Сообщение от оператора
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message,
            username: data.from || 'Оператор',
            timestamp: new Date(),
            isOwn: false
          };
          operator.current = data.from
          setMessages(prev => [...prev, newMessage]);

        } else if (data.type === "advertising" || data.type === "notify" || data.type === "bot_message" || data.type === "greeting") {

          if (data.type === "greeting") {
            data.message.forEach((msg, index) => {
              setTimeout(() => {
                const newMessage: Message = {
                  id: index + Math.random(),
                  message: msg,
                  username: data.from || 'Оператор',
                  timestamp: new Date(),
                  isOwn: false,
                  isButton: true
                };
                setMessages(prev => [...prev, newMessage]);
              }, index * 1000)
            });
          } else {
            const newMessage: Message = {
              id: Date.now().toString() + Math.random(),
              message: data.message || JSON.stringify(data),
              username: data.from || data.type,
              timestamp: new Date(),
              isOwn: false,
              isButton: false
            };
            setMessages(prev => [...prev, newMessage]);
          }

        } else {
          // Неизвестный тип - пытаемся отобразить как есть
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message || JSON.stringify(data),
            username: data.from || 'Система',
            timestamp: new Date(),
            isOwn: false,
            isButton: false
          };
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
        // Если не JSON, показываем как текст
        const newMessage: Message = {
          id: Date.now().toString() + Math.random(),
          message: event.data,
          username: 'Система',
          timestamp: new Date(),
          isOwn: false,
          isButton: false
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket отключен');
      setIsConnected(false);
    };

    // Сохраняем объект WebSocket в состоянии
    setWs(websocket);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    connectToChat();
    setHasJoined(true)
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !ws || !isConnected) return;

    // ✅ ОТПРАВЛЯЕМ JSON вместо простого текста
    const messageData = {
      message: inputValue,
      from: username,  // Тип сообщения
      to: operator.current
    };
    ws.send(JSON.stringify(messageData));

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      message: inputValue,
      username: username,
      timestamp: new Date(),
      isOwn: true,
      isButton: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setMsgReply('')
  };

  if (!isOpen) return null;

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Вход клиента</h2>
            <button
              onClick={onClose}
              className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600"/>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Ваше имя
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите ваше имя"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Подключиться к чату
            </button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 Будет использован ваш session_id из localStorage
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Чат поддержки</h3>
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4"/>
                    <span>Подключен ({username})</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4"/>
                    <span>Отключен</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6"/>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Начните диалог с оператором</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.isOwn
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {message.username}
                  {/* Иконка ОТДЕЛЬНО от className */}
                  {!message.isOwn && (
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-green-600"/>
                  )}
                  {message.isButton ? (
                    <button
                      className="text-xl mt-1 text-blue-400"
                      onClick={() => {
                        const messageData = {
                          message: message.message,  // текст кнопки
                          from: username,
                        };
                        ws.send(JSON.stringify(messageData));
                      }}
                    >
                      <span>{message.message}</span>
                    </button>

                  ) : (
                    <div className="break-words">{message.message}</div>
                  )}
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
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Напишите сообщение..."
              disabled={!isConnected}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
            />
            <button
              type="submit"
              disabled={!isConnected || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}