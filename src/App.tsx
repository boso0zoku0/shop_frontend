import './App.css'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import MainPage from "./components/shop/ListGames.tsx";
import Genres from "./components/shop/ListGenres.tsx";
import ActionGames from "./components/shop/GamesAction.tsx";
import StrategyGames from "./components/shop/GamesStrategy.tsx";
import RpgGames from "./components/shop/GamesRpg.tsx"
import MyAccount from "./components/shop/MyAccount.tsx";
import ChatWebsocket from "./components/shop/websockets/App.tsx";

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
            <li className="text-sky-200 text-shadow-2xs text-shadow-sky-500 font-thick"><a href="/ws">Chat</a>
            </li>

          </ul>
        </nav>
        <Routes>
          <Route path="/account" element={<MyAccount/>}/>
          <Route path="/games" element={<MainPage/>}/>
          <Route path="/genres" element={<Genres/>}/>
          <Route path="/games/action" element={<ActionGames/>}/>
          <Route path="/games/strategy" element={<StrategyGames/>}/>
          <Route path="/games/rpg" element={<RpgGames/>}/>
          <Route path="/ws" element={<ChatWebsocket/>}/>

        </Routes>

      </div>
    </Router>
  );

}
