import FilmGallery from "./Gallery.tsx";
import {useEffect, useState} from "react";
import axios from "axios";

export interface Games {
  id: number;
  name: string;
  genre: string;
  release_year: string;
  story?: string; // Делаем опциональным
  gallery?: string[];
}


export default function RpgGames() {
  const [games, setGames] = useState<Games[]>([]);
  const [expandedFilmId, setExpandedFilmId] = useState<number | null>(null);


  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await axios.get("http://127.0.0.1:8000/games/watch/genre/rpg");
        setGames(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error fetching films:", error);
        setGames([]); // Устанавливаем пустой массив при ошибке
      } finally {
      }
    }

    fetchGames();
  }, []);

  return (
    <div className="text-3xl bg-indigo-950 text-white p-6">
      <div className="mb-36">
        Rpg
      </div>

      <div className="space-y-16">
        {games.map((game) => (
          <div key={game.id} className="bg-gray-900/50 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-8 mb-8">
              <img
                className="w-64 h-96 object-cover rounded-lg shadow-lg"
                src={game.gallery?.[0] || "https://via.placeholder.com/256x384"}
                alt={game.name}
              />

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">{game.name}</h2>
                <div className="flex gap-4 mb-4">
                  <span className="bg-gray-700 px-3 py-1 rounded">{game.release_year}</span>
                </div>
                <p className="text-lg mb-4 line-clamp-3">
                  {expandedFilmId === game.id ? game.story : game.story?.substring(0, 100) + "..."}
                </p>

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