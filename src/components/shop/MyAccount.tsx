import {useEffect, useState} from 'react';
import {User, Mail, Calendar, Trophy, Gamepad2, Star, Clock, Settings} from 'lucide-react';
import axios from "axios";
import {differenceInDays, format, formatDistanceToNow, parseISO} from "date-fns";
import {ru} from "date-fns/locale";


interface Account {
  username: string,
  date_registration: string,
  games: symbol
}

export default function MyAccount() {
  const [user, setUser] = useState<Account[]>([])

  useEffect(() => {
    axios.get("http://localhost:8000/games/account")
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);


  return (
    <div className="min-h-screen bg-indigo-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-start gap-8">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-32 h-32 rounded-full border-4 border-purple-600 shadow-2xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold">{user.username}</h1>
                {/*<span className="px-4 py-1 bg-purple-600 rounded-full text-sm font-semibold">*/}
                {/*  Уровень {user.level}*/}
                {/*</span>*/}
              </div>
              <div className="flex items-center gap-2 text-gray-300 mb-4">
                <Mail className="w-4 h-4"/>
                <span>{user.email}</span>

              </div>

              <span>
                {user?.date_registration ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-x-3.5">
                    <span>Участник с {format(parseISO(user.date_registration), 'dd.MM.yyyy')}.</span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Дней активен: {differenceInDays(new Date(), parseISO(user.date_registration))}
                    </span>
                  </div>
                ) : (
                  'Загрузка даты регистрации...'
                )}
              </span>

            </div>
            <button
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
              <Settings className="w-5 h-5"/>
              Редактировать профиль
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* 1. Первый блок с календарем */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-400"/>
              </div>
              <div>
                <div className="text-3xl font-bold">{user.totalGames || 0}</div>
                <div className="text-gray-400">Игр в избранном</div>
              </div>
            </div>
          </div>

          {/* 2. Второй блок с часами */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-400"/>
              </div>

              {user.date_registration}
              {/*<div>*/}
              {/*  <div className="text-3xl font-bold">18</div>*/}

              {/*  <div className="text-gray-400">Дней активен</div>*/}
              {/*</div>*/}
            </div>
          </div>

          {/* 3. Третий блок со звездой и списком игр */}
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
            <div className="flex items-start gap-4"> {/* Изменил на items-start */}
              <div className="p-3 bg-pink-600/20 rounded-lg">
                <Star className="w-6 h-6 text-pink-400"/>
              </div>

              <div className="flex-1"> {/* Добавил flex-1 для занимания оставшегося пространства */}
                <div className="text-3xl font-bold mb-2">{user.games?.length || 0}</div>
                <div className="text-gray-400 mb-4">Игры в избранном</div>

                {/* Список игр с такими же иконками как в первых двух блоках */}
                <div className="space-y-3">
                  {user.games && user.games.length > 0 ? (
                    user.games.map((game, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800/50 rounded-lg">
                          <Gamepad2 className="w-5 h-5 text-gray-300"/>
                        </div>
                        <span className="text-base truncate">{game}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">В избранном нет игр</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
