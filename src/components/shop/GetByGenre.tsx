import axios from "axios";
import type {Games} from "./GamesAction.tsx";




async function genreAction(): Promise<Games[]> {
  try {
    const response = await axios.get<Games[]>("http://127.0.0.1:8000/games/watch/genre/action");
    return response.data;
  } catch (error) {
    console.error("Ошибка при загрузке игр:", error);
    return [];
  }
}

async function genreRpg() {
  const response = await axios.get("http://127.0.0.1:8000/gameswatch/genre/rpg")
    .then((response) => {
      return response
    })
}

async function genreStrategy() {
  const response = await axios.get("http://127.0.0.1:8000/gameswatch/genre/strategy")
    .then((response) => {
      return response
    })
}

export { genreAction, genreRpg, genreStrategy};