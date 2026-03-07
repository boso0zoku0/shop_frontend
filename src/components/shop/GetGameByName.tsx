import {useFindGame} from "./helpers/reqGames.tsx";
import {useState} from "react";

export default function FindGameByName() {
  const [search, setSearch] = useState('')
  const [findGame, setFindGame] = useState('')

  // Получаем data из хука (стандартное название)
  const { data } = useFindGame(findGame)

  function handleSubmit(e) {
    e.preventDefault()
    setFindGame(search)
  }

  return (
    <div>
      Введи название игры которую хочешь найти
      <form onSubmit={handleSubmit}>
        <input onChange={(e) => setSearch(e.target.value)}/>
        <button>Найти игру</button>
      </form>

      {/* Отображаем результаты */}
      <div>
        {data && (
          <div>
            <h3>Найдена игра:</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}