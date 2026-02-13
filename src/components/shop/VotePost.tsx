import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";

export interface Game {
  id: number;
  name: string;
  genre: string;
  gameplay: string;
  game_development: string;
  release_year: string;
  story: string;
  graphics: string;
  gallery: string[];
}

export default function VoteGames() {
  const {gameParam} = useParams<{ gameParam: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameParam) return;

    const fetchGame = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/games/find?game=${encodeURIComponent(gameParam)}`, {
          withCredentials: true
        });
        setGame(res.data);
      } catch (err) {
        console.error("Error fetching game:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameParam]);

  if (loading) return <p>Loading...</p>;
  if (!game) return <p>Game not found</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold">{game.name}</h1>
      <p className="text-gray-400">Genre: {game.genre}</p>
      <p className="text-gray-400">Release: {game.release_year}</p>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Gameplay</h2>
        <p className="whitespace-pre-wrap">{game.gameplay}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Development</h2>
        <p className="whitespace-pre-wrap">{game.game_development}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Story</h2>
        <p className="whitespace-pre-wrap">{game.story}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Graphics</h2>
        <p className="whitespace-pre-wrap">{game.graphics}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Gallery</h2>
        <div className="flex gap-4 overflow-x-auto">
          {game.gallery.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${game.name} screenshot ${index + 1}`}
              className="w-64 h-36 object-cover rounded-lg shadow-lg flex-shrink-0"
            />
          ))}
        </div>
      </section>
    </div>
  );
}