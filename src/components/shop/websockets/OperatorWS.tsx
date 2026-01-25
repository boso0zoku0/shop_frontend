import { useState, useEffect, useRef } from 'react';
import { Send, X, Wifi, WifiOff, Users } from 'lucide-react';

interface Message {
  client_id: string;
  message: string;
  timestamp: Date;
  fromOperator: boolean;
}

interface ClientMessages {
  [client_id: string]: Message[];
}

interface OperatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OperatorWS({ isOpen, onClose }: OperatorPanelProps) {
  const [messages, setMessages] = useState<ClientMessages>({});
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedClient]);

  useEffect(() => {
    if (isOpen && !ws) {
      connectAsOperator();
    } else if (!isOpen && ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      setMessages({});
      setSelectedClient(null);
    }
  }, [isOpen]);

  const connectAsOperator = () => {
    const websocket = new WebSocket('ws://localhost:8000/operator');

    websocket.onopen = () => {

        console.log('Оператор подключен');
        setIsConnected(true);
    };

    websocket.onmessage = (event) => {

      try {
        const data = JSON.parse(event.data);

        // Получаем сообщение от клиента
        if (data.client_id && data.message) {
          const newMessage: Message = {
            client_id: data.client_id,
            message: data.message,
            timestamp: new Date(),
            fromOperator: false
          };
          setMessages(prev => ({
            ...prev,
            [data.client_id]: [...(prev[data.client_id] || []), newMessage]
          }));

          // Автоматически выбираем клиента, если ничего не выбрано
          if (!selectedClient) {
            setSelectedClient(data.client_id);
          }
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
      setIsConnected(false);
    };

    setWs(websocket);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !ws || !isConnected || !selectedClient) return;

    // Отправляем сообщение конкретному клиенту
    const messageData = {
      target_client_id: selectedClient,
      message: inputValue
    };
    ws.send(JSON.stringify(messageData));

    // Добавляем сообщение в историю
    const newMessage: Message = {
      client_id: selectedClient,
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

  const clientList = Object.keys(messages);
  const currentMessages = selectedClient ? messages[selectedClient] || [] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[700px] flex overflow-hidden">
        {/* Sidebar - список клиентов */}
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

          <div className="flex-1 overflow-y-auto p-2">
            {clientList.length === 0 ? (
              <div className="text-center text-gray-400 mt-8 px-4">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет активных клиентов</p>
              </div>
            ) : (
              <div className="space-y-1">
                {clientList.map((client_id) => {
                  const clientMessages = messages[client_id] || [];
                  const lastMessage = clientMessages[clientMessages.length - 1];
                  const unreadCount = clientMessages.filter(m => !m.fromOperator).length;

                  return (
                    <button
                        key={client_id}
                        onClick={() => {
                          setSelectedClient(client_id);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedClient === client_id
                            ? 'bg-purple-100 border-2 border-purple-500'
                            : 'bg-white hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >


                      <div className="flex items-center justify-between mb-1" onClick={() => unreadCount.toFixed(0)}>
                        <span className="font-semibold text-gray-800 truncate">
                          {client_id}
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

        {/* Основная область чата */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div>
              {selectedClient ? (
                <>
                  <h2 className="font-semibold text-lg text-gray-800">
                    Чат с {selectedClient}
                  </h2>
                  <p className="text-sm text-gray-500">Активен</p>
                </>
              ) : (
                <h2 className="font-semibold text-lg text-gray-400">
                  Выберите клиента
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {!selectedClient ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">👈</div>
                  <p>Выберите клиента из списка</p>
                </div>
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Нет сообщений</p>
                </div>
              </div>
            ) : (
              currentMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.fromOperator ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.fromOperator
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <div className="break-words">{message.message}</div>
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedClient ? "Напишите сообщение..." : "Выберите клиента"}
                disabled={!isConnected || !selectedClient}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
              />
              <button
                type="submit"
                disabled={!isConnected || !selectedClient || !inputValue.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
