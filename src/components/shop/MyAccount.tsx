import {useEffect, useState} from 'react';
import {User, Mail, Calendar, Trophy, Gamepad2, Star, Clock, Settings} from 'lucide-react';
import axios from "axios";
import {differenceInDays, format, parseISO} from "date-fns";


interface Account {
  username: string,
  date_registration: string,
  total_users: number,
  message: string
}

export default function MyAccount() {
  const [userData, setUserData] = useState<Account>()
  const [fullName, setFullName] = useState({
    firstName: 'bob',
    lastName: 'qwe',
    age: 1
  })

  useEffect(() => {
    axios.get("http://localhost:8000/users/about/me",
      {
        withCredentials: true
      })
      .then(response => {
        setUserData(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);
  if (!userData) {
    return (
      <div>Ожадй</div>
      )}

  return (
    <div className="min-h-screen bg-indigo-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-start gap-8">
            <img
              src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSJQcJ_bMZMvP1ZYkq7H3gjnpzWRf3vjjK4g&s"}
              alt={userData.username}
              className="w-32 h-32 rounded-full border-4 border-purple-600 shadow-2xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold">{userData.username}</h1>
              </div>
              <div className="flex items-center gap-2 text-gray-300 mb-4">
                <Mail className="w-4 h-4"/>
                <span>Future Email</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 mb-4">
                <Star className="w-4 h-4"/>
                <footer>{userData.message}</footer>
              </div>

              <span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-x-3.5">
                  <span>Участник с {format(parseISO(userData.date_registration), 'dd.MM.yyyy')}.</span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    Дней активен: {differenceInDays(new Date(), parseISO(userData.date_registration))}
                  </span>
                </div>
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
    </div>
  );
}