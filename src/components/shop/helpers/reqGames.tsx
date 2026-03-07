import {QueryClient, useQuery} from "@tanstack/react-query";
import {useState} from "react";
import axios from "axios";

function useFindGame(gameName) {
  const fetchGame = async (game: string) => {
    if (!game) return null;

    try {
      const res = await axios.get(`http://localhost:8000/games/find?game=${game}`, {
        withCredentials: true
      });
      return res.data; // возвращаем данные при успехе (статус 200)

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
    }
  };
  return useQuery({
    queryKey: ['game', gameName],
    queryFn: () => fetchGame(gameName),
    enabled: !!gameName,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}


function useGetGames() {
  const fetchGames = async () => {

    try {
      const res = await axios.get("http://localhost:8000/games/", {
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
    }
  };
  return useQuery({
    queryKey: ['games'],
    queryFn: () => fetchGames(),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
export { useFindGame, useGetGames };