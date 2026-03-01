import {UserCircle2, Clock, User} from 'lucide-react';
import React from "react";


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

export const OperatorMessageBubble = ({message}: { message: Message }) => {
  const style = message.isOwn
    ? {
      container: 'justify-end',
      bubble: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm',
      textColor: 'text-white',
      timeColor: 'text-purple-100',
    }
    : {
      container: 'justify-start',
      bubble: 'bg-gray-100 text-gray-800 rounded-bl-sm',
      textColor: 'text-gray-800',
      timeColor: 'text-gray-500',
    };

  return (
    <div className={`flex ${style.container} mb-3`}>
      <div className="flex items-end gap-2 max-w-[70%]">
        {!message.isOwn && (
          <div className="bg-blue-100 p-2 rounded-full mb-1 flex-shrink-0">
            <User className="w-5 h-5 text-blue-700"/>
          </div>
        )}

        <div>
          {!message.isOwn && (
            <div className="text-xs text-gray-500 mb-1 ml-1">{message.username}</div>
          )}

          <div className={`px-4 py-3 rounded-2xl ${style.bubble}`}>
            {/* 🔥 ДОБАВЛЯЕМ ОТОБРАЖЕНИЕ МЕДИА */}
            {message.fileUrl && (
              <div className="mb-2">
                {message.mimeType?.startsWith('image/') ? (
                  <img
                    src={`http://localhost:8000${message.fileUrl}`}
                    alt="изображение"
                    className="max-w-full rounded-lg max-h-64 object-contain"
                  />
                ) : message.mimeType?.startsWith('video/') ? (
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

            {/* Текст сообщения (может быть пустым) */}
            {message.message && <div className="break-words">{message.message}</div>}

            <div className={`text-xs mt-1.5 ${style.timeColor} opacity-75 flex items-center gap-1`}>
              <Clock className="w-3 h-3"/>
              {message.timestamp.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {message.isOwn && (
          <div className="bg-purple-100 p-2 rounded-full mb-1 flex-shrink-0">
            <UserCircle2 className="w-5 h-5 text-purple-700"/>
          </div>
        )}
      </div>
    </div>
  );
};