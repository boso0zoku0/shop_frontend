import React, {useState} from 'react';
import axios from 'axios';
import {Link, useNavigate} from 'react-router-dom';


const ManagementLoginRegistration = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault(); // Предотвращаем перезагрузку страницы
             """  Регистрация из CASINO а не SHOP !! ИСПРАВИТЬ!!!  """
    try {
      if (is_login === true) {
        const response = await axios.post(
          'http://127.0.0.1:8000/auth/login',
          {username, password},
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          }
        );

        setMessage(`Вход выполнен успешно! ${response.data.message || ''}`);
        navigate('/games'); // используй useNavigate если в React Router

      } else {
        const response = await axios.post(
          'http://127.0.0.1:8000/auth/registration', // правильный endpoint
          {username, password},
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true
          }
        );

        setMessage(`Регистрация прошла успешно! ${response.data.message || ''}`);
        navigate('/games');
      }

    } catch (error) {
      let errorDetail = '';

      if (error.response) {
        // Сервер ответил с ошибкой
        if (error.response.data?.detail) {
          errorDetail = typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail);
        } else if (error.response.data?.message) {
          errorDetail = error.response.data.message;
        }
      }

      setMessage(`Ошибка ${is_login ? 'входа' : 'регистрации'}: ${errorDetail || error.message}`);
    }


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
            <button type="submit"
                    className="w-64 p-2 bg-blue-500 hover:bg-indigo-600 text-white rounded-md focus:ring-3">
              {is_login == true ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
          <Link to="/" className="w-50 p-2 bg-blue-500 hover:bg-indigo-600 text-white rounded-md">
            Home
          </Link>
        </div>
      </div>
    );
  }}

  export default ManagementLoginRegistration