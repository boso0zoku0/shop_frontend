import FilmGallery from "./Gallery.tsx";
import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import type {Games} from "./GamesAction.tsx";
import {getSessionId} from "./cookieHelper.tsx";


async function fetchGamesByGenre(genre: string): Promise<Games[]> {
  try {
    const response = await axios.get<Games[]>(
      `http://127.0.0.1:8000/games/watch/genre/${genre}`
    );
    return response.data;
  } catch (error) {
    console.error(`Ошибка при загрузке жанра ${genre}:`, error);
    return [];
  }
}


export default function Genres() {
  const [genres, setGenres] = useState([''])
  const navigate = useNavigate();
  //
  // useEffect(() => {
  //   fetchGamesByGenre(genre)
  //     .then((response) => {
  //       setGames(response)
  //     })
  // }, []);


  useEffect(() => {
    async function fetchGenres() {
      try {
        const response = await axios.get(
          "http://localhost:8000/games/watch/genres",
          {
            withCredentials: true
          }
          );
        setGenres(response.data);
      } catch (error) {
        console.error("Error fetching films:", error);
        setGenres([]); // Устанавливаем пустой массив при ошибке
      }
    }

    fetchGenres();
  }, []);

  return (
    <div className="text-3xl bg-indigo-950 text-white p-6">
      <div className="mb-36">
        Genres
      </div>

      <div className="space-y-16">
        {genres.map((genre, index) => (
          <div key={index} className="bg-gray-900/50 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-8 mb-8">
              <img
                className="w-64 h-96 object-cover rounded-lg shadow-lg"
                // genre.photo уже строка, убираем [0]
                src={genre.gallery || "https://via.placeholder.com/256x384"}
                alt={genre.gallery}
                onClick={() => navigate(`/games/${genre.genre}`)} // /games/{genre}
              />
              {/* Просто выводим название жанра */}
              <h2 className="text-4xl font-bold">{genre.genre}</h2>

            </div>
          </div>
          ))}
      </div>
    </div>
  )
}