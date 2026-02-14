import React, {useState, useEffect, useRef} from 'react';
import {X, Send, Wifi, WifiOff, UserCircle2, Bot, Shield, User, Clock} from 'lucide-react';
import {getSessionId, setSessionCookie} from "../cookieHelper.tsx";

interface Message {
  id: string;
  message: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
  isButton?: boolean;
  type?: string; // 'system', 'bot', 'operator', 'client'
}

interface ClientPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ws: WebSocket

}


// Компонент для отображения одного сообщения
const MessageBubble = ({message, onBotMessageClick, username, ws}: {
  message: Message;
  onBotMessageClick?: (text: string) => void;
}) => {
  // Определяем тип отправителя
  const getSenderType = () => {
    if (message.isOwn) return 'client_message';
    if (message.username === 'Система' || message.type === 'greeting' || message.type === 'advertising') return 'system_message';
    if (message.username === 'Bot' || message.type === 'bot_message') return 'bot_message';
    return 'operator_message'; // По умолчанию - оператор
  };

  const senderType = getSenderType();

  // Стили для разных типов отправителей
  const styles = {
    client_message: {
      container: 'justify-end',
      bubble: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm',
      icon: null,
      iconBg: '',
      textColor: 'text-white',
      timeColor: 'text-blue-100'
    },
    operator_message: {
      container: 'justify-start',
      bubble: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-bl-sm shadow-md',
      icon: <UserCircle2 className="w-5 h-5"/>,
      iconBg: 'bg-purple-100',
      textColor: 'text-white',
      timeColor: 'text-purple-100'
    },
    bot_message: {
      container: 'justify-start',
      bubble: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-bl-sm shadow-md cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition-all',
      icon: <Bot className="w-5 h-5 text-emerald-700"/>,
      iconBg: 'bg-emerald-100',
      textColor: 'text-white',
      timeColor: 'text-emerald-100'
    },
    system_message: {
      container: 'justify-center',
      bubble: 'bg-gray-100 text-gray-700 rounded-lg shadow-sm border border-gray-200',
      icon: <Shield className="w-4 h-4 text-gray-500"/>,
      iconBg: 'bg-gray-50',
      textColor: 'text-gray-700',
      timeColor: 'text-gray-500'
    }
  };

  const style = styles[senderType];

  const handleBotClick = () => {
    if (senderType === 'bot_message' && onBotMessageClick) {
      onBotMessageClick(message.message);
    }
  };

  if (senderType === 'system_message') {
    // Системные сообщения в центре
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 px-4 py-2 rounded-full shadow-sm border border-gray-200 max-w-[80%]">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-gray-500"/>
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
      </div>
    );
  }

  return (
    <div className={`flex ${style.container} mb-3`}>
      <div className="flex items-end gap-2 max-w-[70%]">
        {/* Иконка слева для входящих сообщений */}
        {!message.isOwn && style.icon && (
          <div className={`${style.iconBg} p-2 rounded-full mb-1 flex-shrink-0`}>
            {style.icon}
          </div>
        )}

        {/* Сообщение */}
        <div>
          {/* Имя отправителя (для входящих) */}
          {!message.isOwn && (
            <div className="text-xs text-gray-500 mb-1 ml-1">
              {message.username}
            </div>
          )}

          {/* Пузырь сообщения */}
          <div
            className={`px-4 py-3 rounded-2xl ${style.bubble}`}
            onClick={handleBotClick}
          >
            {message.isButton ? (
              <button
                className="text-left hover:no-underline"
                onClick={(e) => {
                  e.stopPropagation();
                  // Отправляем текст кнопки на бэк
                  const messageData = {
                    message: message.message,
                    from: username, // или ваш текущий пользователь
                  };
                  ws.send(JSON.stringify(messageData));
                }}
              > {message.message}
              </button>
            ) : (
              <div className="break-words">{message.message}</div>
            )}
            {/* Время */}
              <div className="text-xs mt-1.5 text-purple-100 opacity-75 flex items-center gap-1">
                <Clock className="w-3 h-3"/>
                {message.timestamp.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
          </div>
        </div>

        {/* Иконка справа для исходящих сообщений */}
        {message.isOwn && (
          <div className="bg-blue-100 p-2 rounded-full mb-1 flex-shrink-0">
            <User className="w-5 h-5 text-blue-700"/>
          </div>
        )}
      </div>
    </div>
  );
};

export function ClientsWS({isOpen, onClose}: ClientPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [msgReply, setMsgReply] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const operator = useRef('');

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
      setHasJoined(false);
    }
  }, [isOpen, ws]);

  async function userByCookie() {
    const session_id = getSessionId();
    if (!session_id) {
      alert('Please login first');
      return null;
    }

    setSessionCookie(session_id);

    try {
      // Замените axios на fetch для упрощения
      const response = await fetch(
        'http://localhost:8000/auth/user-by-cookie',
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error fetching user');
      }

      const data = await response.json();
      return data.username;

    } catch (error: any) {
      console.error('Fetch error:', error.message);
      alert(`Error: ${error.message}`);
      return null;
    }
  }

  const connectToChat = async () => {
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

    websocket.onopen = () => {
      console.log('✓ WebSocket подключен');
      setIsConnected(true);
      setHasJoined(true);
      setIsLoggedIn(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Получено сообщение:', data);

        if (data.type === "operator_message") {
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message,
            username: data.from || 'Оператор',
            timestamp: new Date(),
            isOwn: false,
            type: 'operator_message'
          };
          operator.current = data.from;
          setMessages(prev => [...prev, newMessage]);

        } else if (data.type === "greeting") {
          // Если greeting это массив
          if (Array.isArray(data.message)) {
            data.message.forEach((msg: string, index: number) => {
              setTimeout(() => {
                const newMessage: Message = {
                  id: (Date.now() + index).toString() + Math.random(),
                  message: msg,
                  username: 'Bot',
                  timestamp: new Date(),
                  isOwn: false,
                  isButton: true,
                  type: 'bot_message'
                };
                setMessages(prev => [...prev, newMessage]);
              }, index * 1000);
            });
          } else {
            const newMessage: Message = {
              id: Date.now().toString() + Math.random(),
              message: data.message,
              username: 'Система',
              timestamp: new Date(),
              isOwn: false,
              type: 'system_message',
              isButton: false
            };
            setMessages(prev => [...prev, newMessage]);
          }

        } else if (data.type === "bot_message") {
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message,
            username: 'Bot',
            timestamp: new Date(),
            isOwn: false,
            type: 'bot_message',
            isButton: false
          };
          setMessages(prev => [...prev, newMessage]);

        } else if (data.type === "advertising" || data.type === "notify") {
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message,
            username: 'Система',
            timestamp: new Date(),
            isOwn: false,
            type: 'system',
            isButton: false
          };
          setMessages(prev => [...prev, newMessage]);

        } else {
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message || JSON.stringify(data),
            username: data.from || 'Система',
            timestamp: new Date(),
            isOwn: false,
            type: 'system',
            isButton: false
          };
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
        const newMessage: Message = {
          id: Date.now().toString() + Math.random(),
          message: event.data,
          username: 'Система',
          timestamp: new Date(),
          isOwn: false,
          type: 'system',
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

    setWs(websocket);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    connectToChat();
  };

  // Обработчик клика по сообщению бота
  const handleBotMessageClick = (botMessage: string) => {
    if (!ws || !isConnected) return;

    // Просто отправляем текст сообщения на бэкенд
    const messageData = {
      message: botMessage,
      from: username,
    };
    ws.send(JSON.stringify(messageData));
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !ws || !isConnected) return;

    const messageData = {
      message: inputValue,
      from: username,
      to: operator.current
    };
    ws.send(JSON.stringify(messageData));

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      message: inputValue,
      username: username,
      timestamp: new Date(),
      isOwn: true,
      type: 'client'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setMsgReply('');
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
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Начните диалог с оператором</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onBotMessageClick={handleBotMessageClick}
                  username={username}
                  ws={ws}
                />
              ))}
              <div ref={messagesEndRef}/>
            </>
          )}
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-disabled flex items-center gap-2"
            >
              <Send className="w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}