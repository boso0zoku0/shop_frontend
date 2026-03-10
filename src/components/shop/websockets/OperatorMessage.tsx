import {Paperclip, Send, Video, X} from "lucide-react";
import {useState} from "react";




interface MessageClientProps {
  sendMessage: (e: React.FormEvent) => Promise<void>;  // тип из родителя
  fileInputRef: React.RefObject<HTMLInputElement>;
  isConnected: boolean;
  selectedClient: string | null;
  inputValue: string;  // нужно из родителя
  setInputValue: (value: string) => void;  // нужно из родителя
  selectedFile: File | null;  // нужно из родителя
  setSelectedFile: (file: File | null) => void;  // нужно из родителя
  isUploading: boolean;  // нужно из родителя
  filePreview: string | null;  // нужно из родителя
  setFilePreview: (preview: string | null) => void;  // нужно из родителя
  handleCancelFile: () => void;  // нужно из родителя
}

export default function MessageClient({
  sendMessage,
  fileInputRef,
  isConnected,
  selectedClient,
  inputValue,
  setInputValue,
  selectedFile,
  setSelectedFile,
  isUploading,
  filePreview,
  setFilePreview,
  handleCancelFile
}: MessageClientProps) {

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Файл слишком большой (макс 50MB)');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Неподдерживаемый тип файла');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {/* Превью файла */}
      {selectedFile && filePreview && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg">
            <div className="relative">
              {selectedFile.type.startsWith('image/') ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <Video className="w-8 h-8 text-gray-600" />
                </div>
              )}
              <button
                onClick={handleCancelFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
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
            <Paperclip className="w-5 h-5" />
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
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Отправить
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}