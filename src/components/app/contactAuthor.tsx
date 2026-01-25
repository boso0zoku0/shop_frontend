import {useState} from "react";

export default function AuthorInfo() {
  const [style, setStyle] = useState(false)

  function handleRedirect() {
    window.location.href = 'https://react.dev/learn/synchronizing-with-effects'
  }
  function handleMove() {
    setStyle(!style)
  }

  return (
    <>
      <div>We are on social networks</div>
      <button onClick={handleRedirect} type="button" onMouseEnter={handleMove} className={style ? "bg-green-900": "bg-green-200"}>TELEGRAM</button>
    </>
  )
}