import {useEffect, useRef, useState} from "react";
import axios from "axios";
import FilmGallery from "./Gallery.tsx";
import {useNavigate} from "react-router-dom";
import VerticalRating from "./GameRatingProps.tsx";

interface Games {
  average_rating: number;
  id: number;
  name: string;
  genre: string;
  release_year: string;
  story?: string; // Делаем опциональным
  gallery?: string[];
  game: string // с этого поля и ниже значение приходит от подзапроса отдельного
  average_rating: number
  rating_count: number
  message: string
}


export default function ListGames() {
  const [games, setGames] = useState<Games[]>([]);
  const [expandedFilmId, setExpandedFilmId] = useState<number | null>(null);
  const navigate = useNavigate()


  useEffect(() => {
    axios.get('http://localhost:8000/games/get/rating/all',
      {
        withCredentials: true
      }
      )
      .then(response => {
        setGames(response.data)})
  }, []);



  function navigateToVote(game: string) {
    navigate(`/vote/${encodeURIComponent(game)}`)
  }


  return (
    <div className="text-3xl bg-indigo-950 text-white p-6">
      <div className="mb-36">
        Popular games across all genres
      </div>

      <div className="space-y-16">
        {games.map((game) => (
          <div key={game.id} className="bg-gray-900/50 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-8 mb-8">
              {/* Левая колонка: картинка */}
              <img
                className="w-64 h-96 object-cover rounded-lg shadow-lg"
                src={game.gallery?.[0] || "https://via.placeholder.com/256x384"}
                alt={game.name}
              />

              {/* Правая колонка: информация о игре */}
              <div className="flex-1">
                {/* Заголовок и рейтинг в одном блоке */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{game.name}</h2>
                  <button
                    className={"mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"}
                    onClick={() => navigateToVote(game.name)}
                  >Go To Vote!
                  </button>
                  {/* Рейтинг справа от названия */}
                  <div className="flex items-center">

                    <VerticalRating
                      game={game.name}
                      maxStars={5}
                      initialValue={game.rating_count}
                      onRate={(val) => console.log("Оценка:", val)}
                    />
                  </div>
                </div>

                {/* Жанр и год выпуска */}
                <div className="flex gap-4 mb-4">
                <span className="bg-purple-700 px-3 py-1 rounded">
                  {game.genre}
                </span>
                  <span className="bg-gray-700 px-3 py-1 rounded">
                  {game.release_year}
                </span>
                </div>

                {/* Описание */}
                <p className="text-lg mb-4 line-clamp-3">
                  {expandedFilmId === game.id ? game.story : game.story?.substring(0, 100) + "..."}
                </p>

                {/* Кнопка */}
                <button
                  onClick={() => setExpandedFilmId(expandedFilmId === game.id ? null : game.id)}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  {expandedFilmId === game.id ? "Скрыть" : "Подробнее"}
                </button>
              </div>
            </div>

            {/* Галерея */}
            {game.gallery && game.gallery.length > 1 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Галерея:</h3>
                <FilmGallery film={game}/>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}