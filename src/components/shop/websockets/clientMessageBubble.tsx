import {Bot, Clock, Shield, User, UserCircle2} from "lucide-react";
import React from "react";

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


// Компонент для отображения одного сообщения
export const ClientMessageBubble = ({message, onBotMessageClick, username, ws}: {
  message: Message;
  onBotMessageClick?: (text: string) => void;
}) => {
  // Определяем тип отправителя
  const getSenderType = () => {
    if (message.isOwn && !message.fileUrl) return 'client_message';
    if (message.username === 'Система' || message.type === 'greeting' || message.type === 'advertising') return 'system_message';
    if (message.username === 'Bot' || message.type === 'bot_message') return 'bot_message';
    if (message.type === 'media' || message.fileUrl) return 'media';
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
    },
    media: {
      container: message.isOwn ? 'justify-end' : 'justify-start',
      bubble: message.isOwn
        ? 'bg-gradient-to-r text-white rounded-br-sm'
        : 'bg-gradient-to-r from-gray-500 to-gray-800 text-white rounded-bl-sm shadow-md',
      icon: message.isOwn ? null : <UserCircle2 className="w-5 h-5"/>,
      iconBg: message.isOwn ? '' : 'bg-purple-600',
      textColor: 'text-white',
      timeColor:  message.isOwn ? 'text-blue-500' : 'text-purple-500'
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
        <div className="text-white bg-blue-300 px-4 py-2 rounded-full shadow-sm border border-gray-200 max-w-[80%]">
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
            {/* 🔥 НОВЫЙ БЛОК: отображение медиафайлов */}
            {message.fileUrl && (
              <div className="mb-2">
                {message.mimeType?.startsWith('image') ? (
                  <img
                    src={`http://localhost:8000${message.fileUrl}`}
                    alt="изображение"
                    className="max-w-full rounded-lg max-h-64 object-contain"
                  />
                ) : message.mimeType?.startsWith('video') ? (
                  <video
                    src={`http://localhost:8000${message.fileUrl}`}
                    controls
                    className="max-w-full rounded-lg max-h-64"
                  />
                ) : (
                  <a
                    href={`http://localhost:8000${message.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline"
                  >
                    📎 Скачать файл
                  </a>
                )}
              </div>
            )}

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
  )
}
