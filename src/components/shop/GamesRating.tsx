import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

interface GamesInterface {
  game: string,
  photo: string,
  average_rating: number,
  rating_count: number
}
export default function RatingGames() {
  const [games, setGames] = useState<GamesInterface[]>([])
  const navigate = useNavigate()
  useEffect(() => {
    axios.get("http://localhost:8000/games/get/ratings", {withCredentials: true}).then((resp) => {
      setGames(resp.data)
    })
  }, []);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {games.map((game, index) => (
        <div
          onClick={() => navigate(`/games#${encodeURIComponent(game.game)}`)}
          key={index}
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:bg-gray-50 hover:scale-105"
        >
          <img
            src={game.photo}
            alt={game.game}
            className="w-full h-48 object-cover"
          />

          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {game.game}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 text-xl">★</span>
                <code className="text-lg font-semibold text-gray-700">
                  {game.average_rating.toFixed(1)}
                </code>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>👥</span>
                <span>{game.rating_count} оценок</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {games.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          Загрузка игр...
        </div>
      )}
    </div>
  );
}





// [
//   {
//     "game": "Blitzkrieg",
//     "photo": "https://www.nintendo.com/eu/media/images/assets/nintendo_switch_2_games/eldenringtarnishededition/2x1_NSwitch2_EldenRing.jpg",
//     "average_rating": 6.125,
//     "rating_count": 8
//   },
//   {
//     "game": "Echoes Of Ancestors",
//     "photo": "https://m.media-amazon.com/images/I/71cItdg6PVL._UF1000,1000_QL80_.jpg",
//     "average_rating": 4,
//     "rating_count": 1
//   },
// ]