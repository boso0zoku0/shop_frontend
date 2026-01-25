import {useState, useEffect, useRef} from 'react';
import {Send, X, Wifi, WifiOff, User} from 'lucide-react';

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientsWS({isOpen, onClose}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      // Закрываем WebSocket при закрытии окна
      if (ws) {
        ws.close();
        setWs(null);
      }
      setIsConnected(false);
      setHasJoined(false);
      setMessages([]);
      setUsername('');
      setInputValue('');
    }
  }, [isOpen]);

  const connectToChat = () => {
    if (!username.trim()) {
      alert('Пожалуйста, введите имя пользователя');
      return;
    }

    const websocket = new WebSocket(`ws://localhost:8000/clients/${username}`);

    websocket.onopen = () => {
      setIsConnected(true);
      setHasJoined(true);
    };

    websocket.onmessage = (event) => {
      console.log(websocket.protocol)
      try {
        // Клиент получает JSON от оператора
        const data = JSON.parse(event.data);

        if (data.type === "operator_message") {
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message,
            username: 'Оператор',
            timestamp: new Date(),
            isOwn: false
          };

          setMessages(prev => [...prev, newMessage]);
        }

        // Можно добавить обработку других типов сообщений
        else if (data.type === "operator.status") {  // На будущее для broadcast
          // Обработка broadcast сообщений
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: `📢 ${data.message}`,
            username: 'Система',
            timestamp: new Date(),
            isOwn: false
          };

          setMessages(prev => [...prev, newMessage]);
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
      console.log('WebSocket отключен');
      setIsConnected(false);
    };

    setWs(websocket);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !ws || !isConnected) return;

    // Клиент отправляет простой текст (не JSON)
    ws.send(inputValue);

    // Добавляем собственное сообщение в список
    const ownMessage: Message = {
      id: Date.now().toString() + Math.random(),
      message: inputValue,
      username: username,
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, ownMessage]);
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              💬
            </div>
            <div>
              <h2 className="font-semibold text-lg">Чат</h2>
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
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* Join Form or Chat */}
        {!hasJoined ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
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

              <form onSubmit={(e) => {
                e.preventDefault();
                connectToChat();
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
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <p>Сообщений пока нет</p>
                    <p className="text-sm">Начните разговор!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.isOwn
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {!message.isOwn && (
                        <div className="text-xs font-semibold mb-1 opacity-70">
                          {message.username}
                        </div>
                      )}
                      <div className="break-words">{message.message}</div>
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
          </>
        )}
      </div>
    </div>
  );
}