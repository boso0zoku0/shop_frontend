import {useEffect, useState} from "react";
import axios from "axios";

interface VerticalRatingProps {
  game: string;
  maxStars?: number;
  initialValue?: number;
  onRate?: (value: number) => void;
  onSuccess?: (updatedGameData: any) => void; // новый колбэк для передачи данных
}

export default function VerticalRating({
  game,
  maxStars = 5,
  initialValue = 0,
  onRate,
  onSuccess
}: VerticalRatingProps) {
  const [rating, setRating] = useState<number>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSetRating = async (starIndex: number) => {
    const value = maxStars - starIndex;

    // Оптимистичное обновление UI (ваша личная оценка)
    setRating(value);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:8000/games/vote/rating?game=${game}&rating=${value}`,
        null,
        { withCredentials: true }
      );

      // ✅ Передаем ВСЕ данные с бэка в родительский компонент
      if (onSuccess) {
        onSuccess(response.data); // { game, photo, average_rating, rating_count }
      }

      if (onRate) onRate(value);

    } catch (error) {
      console.error('Ошибка при оценке:', error);
      setRating(initialValue);
      alert('Не удалось сохранить оценку');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {isLoading && <span className="text-sm text-gray-400">Сохранение...</span>}

      {Array.from({length: maxStars}).map((_, i) => {
        const isFilled = i >= maxStars - rating;
        return (
          <svg
            key={i}
            onClick={() => !isLoading && fetchSetRating(i)}
            xmlns="http://www.w3.org/2000/svg"
            fill={isFilled ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={`w-8 h-8 cursor-pointer transition-colors ${
              isFilled ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        );
      })}
      <span className="text-white text-sm mt-1">{rating}/{maxStars}</span>
    </div>
  );
}