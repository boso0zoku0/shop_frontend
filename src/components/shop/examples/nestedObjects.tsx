import {useState} from "react";

export default function Objects() {
  const [person, setPerson] = useState({
  name: 'Niki de Saint Phalle',
  artwork: {
    title: 'Blue Nana',
    city: 'Hamburg',
    image: 'https://i.imgur.com/Sd1AgUOm.jpg',
  }
});
  function handleChange(e) {
    setPerson({
      ...person,
      artwork: {
        ...person.artwork,
        city: 'qew'
      }
    })

  }



  return (

    <input onChange={handleChange}/>
  )
}