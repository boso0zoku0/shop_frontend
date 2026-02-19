import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Genres from "./components/shop/ListGenres.tsx";
import ActionGames from "./components/shop/GamesAction.tsx";
import StrategyGames from "./components/shop/GamesStrategy.tsx";
import RpgGames from "./components/shop/GamesRpg.tsx"
import ChatWebsocket from "./components/shop/websockets/App.tsx";
import RegistrationUsers from "./components/shop/Auth/Registration.tsx";
import LoginUsers from "./components/shop/Auth/Login.tsx";
import VoteGames from "./components/shop/VotePost.tsx";
import ListGames from "./components/shop/ListGames.tsx";
import Payment from "./components/shop/payments/payment.tsx";

export default function App() {
  return (
    <Router>
      <div>
        <nav className="menu flex justify-between w-full mb-20">
          <ul className="flex space-x-4">
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/games">Games</a></li>
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/genres">Genres</a>
            </li>
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/account">Account</a>
            </li>
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/ws">Support-Chat</a>
            </li>
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/registration">Registration</a>
            </li>
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/login">Login</a>
            </li>
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/payment">Payment</a>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/login" element={<LoginUsers/>}/>
          <Route path="/registration" element={<RegistrationUsers/>}/>
          <Route path="/games" element={<ListGames/>}/>
          <Route path="/genres" element={<Genres/>}/>
          <Route path="/games/action" element={<ActionGames/>}/>
          <Route path="/games/strategy" element={<StrategyGames/>}/>
          <Route path="/games/rpg" element={<RpgGames/>}/>
          <Route path="/ws" element={<ChatWebsocket/>}/>
          <Route path="/vote/:gameParam" element={<VoteGames />}/>
          <Route path="/payment" element={<Payment />}/>

        </Routes>

      </div>
    </Router>
  );

}
