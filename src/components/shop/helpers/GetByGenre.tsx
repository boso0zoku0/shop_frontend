import axios from "axios";
import type {Games} from "../GamesAction.tsx";
import {useQuery} from "@tanstack/react-query";




async function genreAction(): Promise<Games[]> {
  try {
    const response = await axios.get<Games[]>("http://localhost:8000/games/watch/genre/action");
    return response.data;
  } catch (error) {
    console.error("Ошибка при загрузке игр:", error);
    return [];
  }
}

async function genreRpg() {
  const response = await axios.get("http://localhost:8000/games/watch/genre/rpg")
    .then((response) => {
      return response
    })
}

function useGetGenreStrategy() {
  const fetchStrategy = async () => {
    try {
      const res = await axios.get("http://localhost:8000/games/watch/genre/strategy", {
        withCredentials: true
      });
      return res.data;

    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          return 'Not Found'; // возвращаем строку при 404
        }
        console.error('Ошибка сервера:', error.response.status);
        throw new Error(`Ошибка сервера: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('Сервер не отвечает');
      } else {
        throw new Error('Ошибка при отправке запроса');
      }
    }}
    return useQuery({
      queryKey: ['strategy'],
      queryFn: () => fetchStrategy(),
      staleTime: 5 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    })}
export { genreAction, genreRpg, useGetGenreStrategy};