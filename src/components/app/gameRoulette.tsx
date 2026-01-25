import React, {useRef, useState} from "react";
import axios from "axios";

const GameRoulette = () => {
  const initialImageUrl = 'https://res.klook.com/image/upload/w_750,h_469,c_fill,q_85/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/nabd3lsoifdkrmfifqrn.jpg'

  const [bet, setBet] = useState('');
  const [message, setMessage] = useState('')
  const [mask, setMask] = useState(0)
  const [images, setImages] = useState([initialImageUrl])

  const addImage = () => {
    setImages(prevImages => [...prevImages, initialImageUrl]);
  };

  function handleMouseMoveBetPlace() {
    const interval = setInterval(() => {
      setMask(prevMask => {
        if (prevMask >= 1000) {
          return 0;
        }
        return prevMask + 100;
      });
    }, 3000);

    return () => clearInterval(interval);
  }


  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const encodedBet = encodeURIComponent(bet)
      const response = await fetch(`http://127.0.0.1:8000/roulette/join?bet=${encodedBet}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'credentials': 'include' // разрешить отправку куков
        },
        body: JSON.stringify({bet: parseInt(bet)}),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      setMessage(data.result ? `Your bet ${data.result} has been successfully` : `Server returned an empty result.`);

    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  // return (
  //   <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
  //     <label htmlFor="bet" className="text-white p-2 font-poppins">
  //       Bet: {message}
  //     </label>
  //     <input
  //       type="text"
  //       id="bet"
  //       required
  //       onChange={(e) => setBet(e.target.value)}
  //       className="w-64 p-2 border rounded-md border-pink-700"
  //     />
  //
  //     <button type={'submit'}
  //             className={`mask-b-from-sky-${mask} w-64 p-2 bg-blue-500 hover:bg-indigo-600 text-white rounded-md focus:ring-3`}
  //             onMouseEnter={handleMouseMoveBetPlace}
  //     >Bet place
  //     </button>
  //     <div className="grid grid-cols-2 gap-4 text-green-600">
  //       <div>01</div>
  //       <div>02</div>
  //       <div>03</div>
  //       <div>04</div>
  //     </div>
  //   </form>
  // )
  return (
    <div className="flex flex-col items-center p-7 rounded-2xl">
      <div className="flex">
        <span>The Anti-Patterns</span>
      </div>
      <div>
        <div className="flex space-x-4">
          {images.map((src, index) => (
            <img key={index} src={src} alt="" className="size-22 shadow-xl rounded-md"/>
          ))}
        </div>
        <button className="mt-32 mb-32" onClick={addImage}>Add Image</button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <label htmlFor="bet" className="text-white p-2 font-poppins">
          Bet: {message}
        </label>
        <input
          type="text"
          id="bet"
          required
          onChange={(e) => setBet(e.target.value)}
          className="w-64 p-2 border rounded-md border-pink-700"
        />
        <button type={'submit'}
                className={`mask-b-from-sky-${mask} w-64 p-2 bg-blue-500 hover:bg-indigo-600 text-white rounded-md focus:ring-3`}
                onMouseMove={handleMouseMoveBetPlace}
        >Bet place
        </button>
        <div className="grid grid-cols-2 gap-4 text-green-600">
          <div>01</div>
          <div>02</div>
          <div>03</div>
          <div>04</div>
        </div>
      </form>
    </div>
  )
}

export default GameRoulette