import React, {useEffect, useState} from "react";
import axios from "axios";
import {Lock} from "lucide-react";


export default function Payment() {
  const [price, setPrice] = useState<number>(0)
  const [load, setLoad] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [useSavedCard, setUseSavedCard] = useState(false) // новый state

  const handlePayment = async () => {
    if (!price || price <= 0) {
      setError('Введите корректную сумму')
      return
    }

    setLoad(true)
    setError(null)
    try {
      // Выбираем эндпоинт в зависимости от чекбокса
      const endpoint = useSavedCard
        ? 'http://localhost:8000/payments/add/payment/future/linking'  // с привязкой карты
        : 'http://localhost:8000/payments/add'               // обычный платеж

      const resp = await axios.post(
        `${endpoint}?price=${price}`,
        {},
        {withCredentials: true}
      )

      // Сохраняем ответ для отображения
      setResponse(resp.data)

      // Редирект на страницу оплаты ЮKassa (если есть)
      if (resp.data.confirmation?.confirmation_url) {
        window.location.href = resp.data.confirmation.confirmation_url
      }

    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`Ошибка ${err.response.status}: ${err.response.data?.detail || 'Неизвестная ошибка'}`)
        } else if (err.request) {
          setError('Сервер не отвечает. Проверьте подключение.')
        } else {
          setError(`Ошибка запроса: ${err.message}`)
        }
      } else {
        setError('Произошла неизвестная ошибка')
      }
    } finally {
      setLoad(false)
    }
  }

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div
          className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Основная карточка */}
      <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-96 border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          💳 Сделать платеж
        </h2>

        <div className="space-y-4">
          {/* Поле ввода суммы */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-white/60">₽</span>
            </div>
            <input
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="Введите сумму"
              min="1"
            />
          </div>

          {/* Чекбокс для привязки карты */}
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div
              className={`relative w-6 h-6 rounded-md border-2 transition-all cursor-pointer flex items-center justify-center flex-shrink-0
                ${useSavedCard
                ? 'bg-purple-500 border-purple-400'
                : 'bg-white/10 border-white/30'}`}
              onClick={() => setUseSavedCard(!useSavedCard)}
            >
              {useSavedCard && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"/>
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">Привязать карту</p>
              <p className="text-white/40 text-xs">В дальнейшем оплачивайте без указания карты</p>
            </div>

            {/* Бейдж с фиксированной шириной */}
            <div className="flex-shrink-0 w-16 text-right">
              {useSavedCard && (
                <div className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full inline-block">
                  активно
                </div>
              )}
            </div>
          </div>

          {/* Кнопка оплаты */}
          <button
            onClick={handlePayment}
            disabled={load}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {load ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                     fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Обработка...
              </span>
            ) : useSavedCard ? 'Оплатить и привязать карту' : 'Оплатить'}
          </button>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"/>
                </svg>
                {error}
              </span>
            </div>
          )}

          {/* Сообщение об успехе */}
          {response && response.id && !load && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-200 text-sm">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"/>
                </svg>
                Платеж создан: {response.id.slice(0, 8)}...{response.id.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}