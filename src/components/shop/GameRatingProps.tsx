import {useEffect, useState} from "react";
import {Rating} from "react-simple-star-rating";
import axios from "axios";

interface VerticalRatingProps {
  maxStars?: number;             // сколько звёзд
  initialValue?: number;         // начальный рейтинг
  onRate?: (value: number) => void; // колбэк при клике
}

export default function VerticalRating({game, maxStars = 5, initialValue = 0, onRate}: VerticalRatingProps) {
  const [rating, setRating] = useState<number>(initialValue);
  const [resp, setResp] = useState('')

  const handleClick = (index: number) => {

    const value = maxStars - index; // нижняя звезда = 1
    setRating(value);
    try {
      axios.post(
        `http://localhost:8000/games/vote/rating?game=${game}&rating=${value}`,
        null, // тело запроса, оставляем пустым
        {
          withCredentials: true // ← передаем здесь, в конфиге
        }
      ).then((data) => setResp(data.data));
    } catch (e) {
      alert(e);
    if (onRate) onRate(value);
    }
  };


  return (
    <div className="flex flex-col items-center gap-1">
      {Array.from({length: maxStars}).map((_, i) => {
        const filled = i >= maxStars - rating ? "text-yellow-400" : "text-gray-300";
        return (
          <svg
            key={i}
            onClick={() => handleClick(i)}
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={`w-8 h-8 cursor-pointer ${filled}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        );
      })}
      <span className="text-white mt-2">{rating} / {maxStars}</span>
    </div>
  );
}