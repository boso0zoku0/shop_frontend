import React, {useState, useEffect, useRef} from 'react';
import {X, Send, Wifi, WifiOff, UserCircle2, Bot, Shield, User, Clock, FileUser, Paperclip, Video} from 'lucide-react';
import {getSessionId, setSessionCookie} from "../helpers/cookieHelper.tsx";
import {ClientMessageBubble} from "./clientMessageBubble.tsx"
import axios from "axios";

interface Message {
  id: string;
  message: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
  isButton?: boolean;
  type?: string; // 'system', 'bot', 'operator', 'client', 'media'
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string
}

interface ClientPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ws: WebSocket

}

export function ClientsWS({isOpen, onClose}: ClientPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [msgReply, setMsgReply] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const operator = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };
// from_user_id
// to_user_id
// message
// file_url
// mime_type
// type_message



  //   message: string;
  // username: string;
  // timestamp: Date;
  // isOwn: boolean;
  // isButton?: boolean;
  // type?: string; // 'system', 'bot', 'operator', 'client', 'media'
  // fileUrl?: string;
  // fileName?: string;
  // fileSize?: string;
  // mimeType?: string
  useEffect(() => {
    scrollToBottom();
  }, [messages, inputValue]);

  useEffect(() => {
  axios.get("http://localhost:8000/get-user-dialog", {withCredentials: true})
    .then((response) => {
      const messageTransform = response.data.map((data) => ({
        id: data.id,
        message: data.message,
        username: data.username,
        timestamp: new Date(data.created_at),
        isOwn: true,
        type: data.type_message
      }))
      setMessages(messageTransform)
    })

    .catch(error => {
      console.error('Ошибка загрузки истории:', error);
    });
}, []);

  // Очистка превью при размонтировании
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

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
        } else if (data.type === "media") {
          console.log(data.type)
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message,
            username: data.from || 'Оператор',
            timestamp: new Date(),
            isOwn: false,
            type: 'media',
            mimeType: data.mime_type,
            fileUrl: data.file_url
          }
          operator.current = data.from;
          setMessages(prev => [...prev, newMessage])

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

  // Обработчик выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Проверка размера файла (макс 10MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('Файл слишком большой. Максимальный размер: 50MB');
      return;
    }

    // Проверка типа файла
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Неподдерживаемый формат файла. Используйте: JPEG, PNG, GIF, WebP, MP4, WebM');
      return;
    }

    setSelectedFile(file);

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Отмена выбора файла
  const handleCancelFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Загрузка файла на сервер
  const uploadFile = async (file: File): Promise<{ url: string; type: 'image' | 'video' } | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post("http://localhost:8000/media/upload-file", formData, {withCredentials: true})
      return {
        url: response.data.file_url,
        type: response.data.mime_type,
      };
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert('Не удалось загрузить файл');
      return null;
    } finally {
      setIsUploading(false);
    }
  };


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || !isConnected) return;

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (selectedFile) {
      const uploadResult = await uploadFile(selectedFile);
      if (uploadResult) {
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.type;
      } else {
        // Если загрузка не удалась, не отправляем сообщение
        return;
      }
    }

    // Проверяем, есть ли текст или медиа
    if (!inputValue.trim() && !mediaUrl) {
      return;
    }

    const messageData: any = {
      message: inputValue || '',
      from: username,
      to: operator.current,
    };

    // Добавляем информацию о медиа, если есть
    if (mediaUrl && mediaType) {
      messageData.file_url = mediaUrl;
      messageData.mime_type = mediaType;
    }

    ws.send(JSON.stringify(messageData));

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      message: inputValue,
      username: username,
      timestamp: new Date(),
      isOwn: true,
      type: 'client',
      fileUrl: mediaUrl,
      mimeType: mediaType,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setMsgReply('');
    handleCancelFile()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Шапка чата */}
        <div
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <User className="w-6 h-6"/>
            </div>
            <div>
              <h3 className="font-semibold">{username}</h3>
              <p className="text-sm text-purple-100">
                {isConnected ? '✓ Подключен' : '✗ Не подключен'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
          {messages.map((msg) => (
            <ClientMessageBubble
              key={msg.id}
              message={msg}
              onBotMessageClick={handleBotMessageClick}
              username={username}
              ws={ws}
            />
          ))}
          <div ref={messagesEndRef}/>
        </div>

        {/* Превью выбранного файла */}
        {selectedFile && filePreview && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg">
              <div className="relative">
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-600"/>
                  </div>
                )}
                <button
                  onClick={handleCancelFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3"/>
                </button>
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-gray-800 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Форма ввода */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
          <div className="flex gap-2">
            {/* Кнопка выбора файла */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
            >
              <Paperclip className="w-5 h-5"/>
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={selectedFile ? 'Добавьте сообщение к фото' : 'Введите сообщение'}
              disabled={!isConnected}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"/>
            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={(!inputValue.trim() && !selectedFile) || !isConnected || isUploading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Загрузка...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5"/>
                  Отправить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}