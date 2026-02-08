import React, {useEffect, useRef} from 'react';
import { X, UserPlus, UserMinus } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
  const notificationsRef = useRef<HTMLDivElement>(null);
  if (!notification) return null;

  // Автозакрытие через 4 секунды
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Иконка в зависимости от типа
  const getIcon = () => {
    if (notification.type === 'client_connected') {
      return <UserPlus className="w-5 h-5 text-green-500" />;
    }
    if (notification.type === 'client_disconnected') {
      return <UserMinus className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  // Цвет фона
  const getBgColor = () => {
    if (notification.type === 'client_connected') {
      return 'bg-green-50 border-green-200';
    }
    if (notification.type === 'client_disconnected') {  // На будущее(уведомлять об отключившихся)
      return 'bg-red-50 border-red-200';
    }
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className={`fixed bottom-4 right-4 w-80 ${getBgColor()} border rounded-lg shadow-lg p-4 animate-slide-in z-50`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div>
            <h4 className="font-semibold text-gray-900">
              {notification.type}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Client <span className="font-medium">{notification.client}</span> has joined
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;