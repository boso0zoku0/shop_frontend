import React, {useState} from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';


const RegistrationForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault(); // Предотвращаем перезагрузку страницы

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/auth/registrations',
        {username, password}, // Данные отправляются в формате JSON
        {
          headers: {
            'Content-Type': 'application/json', // Новый заголовок
          },
          withCredentials: true
        }
      );
      setMessage(`Регистрация прошла успешно! ${response.data.message || ''}`);
      // window.location.href = 'http://localhost:5173/games'
    } catch (error) {

      let errorDetail = '';
      if (error.response && error.response.data.detail) {
        errorDetail = typeof error.response.data.detail === 'string' ?
          error.response.data.detail :
          JSON.stringify(error.response.data.detail);
      }
      setMessage(`Ошибка регистрации: ${errorDetail || error.message}`);
    }

  };

  return (
    <div className="flex items-center justify-center h-screen div">
      <div className="flex flex-col items-center space-y-4">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOHJNyiVkFRRlC2xZTXedtnnAJ0PqSU2Jp3A&s"
          alt="casino"
          width="300"
          height="300"
          className="rounded-lg md:aspect-video lg:aspect-square sm:aspect-retro"
        />

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
          <label htmlFor="username" className="text-white p-2 font-poppins">
            Username:
          </label>
          <input
            type="text"
            id="username"
            required
            onChange={(e) => setUsername(e.target.value)}
            className="w-64 p-2 border rounded-md border-pink-700"
          />
          <label htmlFor="password" className="text-white p-2 font-poppins">
            Password:
          </label>
          <input
            type="password"
            id="password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-64 p-2 border rounded-md border-pink-600"
          />
          <label htmlFor="email" className="text-white p-2 font-poppins">
            Email:
          </label>
          <button type="submit" className="w-64 p-2 bg-blue-500 hover:bg-indigo-600 text-white rounded-md focus:ring-3">
            Зарегистрироваться
          </button>
        </form>
        <Link to="/" className="w-50 p-2 bg-blue-500 hover:bg-indigo-600 text-white rounded-md">
          Home
        </Link>
      </div>
    </div>
  );
}

export default RegistrationForm