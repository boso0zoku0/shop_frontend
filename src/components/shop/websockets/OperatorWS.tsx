import {useState, useEffect, useRef} from 'react';
import {Users, Wifi, WifiOff, Send, X, UserCircle2, User, Clock, Video, Paperclip} from 'lucide-react';
import axios from 'axios';
import {OperatorMessageBubble} from "./operatorMessageBubble.tsx";


interface Message {
  id: string;
  message: string;
  username: string;
  timestamp: Date;
  isOwn: boolean;
  type?: string,
  fileUrl?: string,
  mimeType?: string,
}

interface Client {
  username: string;
  isActive: boolean;
  unreadCount: number;
}

interface OperatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = 'http://localhost:8000';


export function OperatorWS({isOpen, onClose}: OperatorPanelProps) {
  const [operatorName, setOperatorName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedClient]);

  useEffect(() => {
    if (!isOpen && ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  }, [isOpen, ws]);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Подключение к WebSocket
  const connectToChat = async () => {
    if (!operatorName.trim()) {
      alert('Введите имя оператора');
      return;
    }

    const websocket = new WebSocket(`ws://localhost:8000/operator/${operatorName}`);

    websocket.onopen = () => {
      console.log('✓ Оператор подключен');
      setIsConnected(true);
      setIsLoggedIn(true);
      loadClients();
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Получено сообщение:', data);

        if (data.type === 'client_message' || data.from && !data.file_url && !data.media_url) {
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message || '',
            username: data.from,
            timestamp: new Date(),
            isOwn: false,
          };

          setMessages((prev) => ({
            ...prev,
            [data.from]: [...(prev[data.from] || []), newMessage],
          }));

          // Обновляем счетчик непрочитанных, если это не активный чат
          if (selectedClient !== data.from) {
            setClients((prev) =>
              prev.map((c) =>
                c.username === data.from ? {...c, unreadCount: c.unreadCount + 1} : c
              )
            );
          }
        } else if (data.type == "media") {
          console.log(data.type)
          const newMessage: Message = {
            id: Date.now().toString() + Math.random(),
            message: data.message || '',
            username: data.from,
            timestamp: new Date(),
            isOwn: false,
            type: "media",
            mimeType: data.mime_type,
            fileUrl: data.file_url,
          };

          setMessages((prev) => ({
            ...prev,
            [data.from]: [...(prev[data.from] || []), newMessage],
          }));
        }
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
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

  // Загрузка списка клиентов
  const loadClients = async () => {
    try {
      const response = await fetch(`${API_URL}/get-clients`);
      const clientsList = await response.json();

      setClients(
        clientsList.map((username: string) => ({
          username,
          isActive: true,
          unreadCount: 0,
        }))
      );
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    }
  };

  // Выбор клиента
  const selectClient = (clientName: string) => {
    setSelectedClient(clientName);
    // Сбрасываем счетчик непрочитанных
    setClients((prev) =>
      prev.map((c) => (c.username === clientName ? {...c, unreadCount: 0} : c))
    );
  };

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Файл слишком большой. Максимальный размер: 50MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Неподдерживаемый формат файла');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

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

  // Отправка сообщения
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ws || !isConnected || !selectedClient) return;

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (selectedFile) {
      const uploadResult = await uploadFile(selectedFile);
      if (uploadResult) {
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.type;
      } else {
        return;
      }
    }

    if (!inputValue.trim() && !mediaUrl) {
      return;
    }

    const messageData: any = {
      message: inputValue || '',
      from: operatorName,
      to: selectedClient,
    };

    if (mediaUrl && mediaType) {
      messageData.file_url = mediaUrl;
      messageData.mime_type = mediaType;
    }

    ws.send(JSON.stringify(messageData));

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      message: inputValue,
      username: operatorName,
      timestamp: new Date(),
      isOwn: true,
      fileUrl: mediaUrl,
      mimeType: mediaType,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedClient]: [...(prev[selectedClient] || []), newMessage],
    }));

    setInputValue('');
    handleCancelFile();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    connectToChat();
  };

  if (!isOpen) return null;

  // Экран входа
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserCircle2 className="w-8 h-8 text-white"/>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Панель оператора</h2>
            <p className="text-gray-600 mt-2">Введите ваше имя для входа</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Имя оператора"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-gray-900"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Войти
            </button>
          </form>

          <button onClick={onClose} className="w-full mt-4 text-gray-600 hover:text-gray-800 transition-colors">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  // Панель оператора
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex">
        {/* Список клиентов */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6"/>
              <h3 className="font-semibold">Клиенты</h3>
            </div>
            <p className="text-sm text-purple-100">{operatorName}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Нет активных клиентов</div>
            ) : (
              clients.map((client) => (
                <button
                  key={client.username}
                  onClick={() => selectClient(client.username)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-purple-50 transition-colors ${
                    selectedClient === client.username ? 'bg-purple-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-700"/>
                        </div>
                        {client.isActive && (
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"/>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{client.username}</p>
                        <p className="text-xs text-gray-500">
                          {client.isActive ? 'В сети' : 'Не в сети'}
                        </p>
                      </div>
                    </div>
                    {client.unreadCount > 0 && (
                      <div
                        className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {client.unreadCount}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Область чата */}
        <div className="flex-1 flex flex-col">
          {/* Шапка */}
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
            <div>
              {selectedClient ? (
                <>
                  <h3 className="font-semibold">{selectedClient}</h3>
                  <p className="text-sm text-purple-100">
                    {isConnected ? '✓ Подключен' : '✗ Не подключен'}
                  </p>
                </>
              ) : (
                <p className="text-purple-100">Выберите клиента из списка</p>
              )}
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-6 h-6"/>
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
            {selectedClient ? (
              <>
                {messages[selectedClient]?.map((msg) => (
                  <OperatorMessageBubble key={msg.id} message={msg}/>
                ))}
                <div ref={messagesEndRef}/>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Выберите клиента для начала общения
              </div>
            )}
          </div>

          {/* Превью файла */}
          {selectedFile && filePreview && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3 bg-white p-2 rounded-lg">
                <div className="relative">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded"/>
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
                  <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                  <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Форма ввода */}
          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="operator-file-input"
              />
              <label
                htmlFor="operator-file-input"
                className={`bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-center ${
                  !selectedClient ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Paperclip className="w-5 h-5"/>
              </label>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedClient ? 'Введите сообщение...' : 'Выберите клиента'}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                disabled={!selectedClient}
              />

              <button
                type="submit"
                disabled={(!inputValue.trim() && !selectedFile) || !isConnected || !selectedClient || isUploading}
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
    </div>
  );
}
