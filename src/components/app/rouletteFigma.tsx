import {useState, useEffect, useRef} from 'react';

import {Timer, TrendingUp} from 'lucide-react';
import axios from "axios";


async function playmatesGame() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/roulette/fetch/');
    console.log(response.data)
    return response.data; // возвращаете список фото
  } catch (error) {
    console.error('Ошибка при получении фотографий:', error);
    return [];
  }
}

async function winnerChoice() {
  try {
    const response = await axios.get("http://127.0.0.1:8000/roulette/winner")
    return response.data;
  } catch (error) {
    console.log('Ошибка:', error);
    return []
  }
}


// Определяем типы фаз игры
// 'betting' - игроки делают ставки
// 'spinning' - рулетка крутится
// 'result' - показываем результат
type GamePhase = 'betting' | 'spinning' | 'result';


export default function RouletteFigma() {
  // Состояние текущей фазы игры (по умолчанию - прием ставок)
  const [phase, setPhase] = useState<GamePhase>('betting');

  const [timer, setTimer] = useState(5);

  // Смещение (offset) для прокрутки ленты рулетки в пикселях
  const [offset, setOffset] = useState(0);

  // Предмет-победитель (null если еще не определен)
  const [winner, setWinner] = useState([])

  const [playmates, setPlaymates] = useState([])

  // Общий банк в игре (сумма всех ставок)
  const [totalPot, setTotalPot] = useState(0);

  // Ссылка на DOM элемент контейнера рулетки
  const containerRef = useRef<HTMLDivElement>(null);

  // Создаем массив из 20 повторений items для бесконечной прокрутки
  // Array(20) создает массив из 20 элементов
  // .fill(items) заполняет каждый элемент массивом items
  // .flat() разворачивает вложенные массивы в один
  const repeatedItems = Array(20).fill(playmates).flat();

  //   useEffect(() => {
  //     winnerChoice().then(data => setWinner(data))
  //       .catch(error => console.log(error))
  //   }, []);
  // }

  useEffect(() => {
    playmatesGame()
      .then(data => {
        // Вычисляем общую сумму ставок
        const total = data.reduce((sum, player) => sum + player.bet, 0);
        setTotalPot(total);

        // Добавляем процент для каждого игрока
        const playmatesWithPercentage = data.map(player => ({
          ...player,
          percentage: total > 0 ? (player.bet / total) * 100 : 0
        }));

        setPlaymates(playmatesWithPercentage);
        console.log(playmatesWithPercentage)
      })
      .catch(error => {
        console.log(error);
      });
  }, []);

  // Добавляем периодический опрос сервера для обновления списка игроков
  useEffect(() => {
    // Опрашиваем сервер каждые 2 секунды только во время фазы ставок
    if (phase === 'betting') {
      const pollingInterval = setInterval(() => {
        playmatesGame()
          .then(data => {
            const total = data.reduce((sum, player) => sum + player.bet, 0);
            setTotalPot(total);

            const playmatesWithPercentage = data.map(player => ({
              ...player,
              percentage: total > 0 ? (player.bet / total) * 100 : 0
            }));

            setPlaymates(playmatesWithPercentage);
          })
          .catch(error => {
            console.log(error);
          });
      }, 2000); // Опрашиваем каждые 2 секунды

      return () => clearInterval(pollingInterval);
    }
  }, [phase]); // Зависимость только от phase


  // useEffect выполняется при монтировании компонента
  // Запускает интервал для таймера
  useEffect(() => {
    // Создаем интервал, который выполняется каждую секунду (1000 мс)
    const interval = setInterval(() => {
      // Обновляем состояние таймера
      setTimer((prev) => {
        // prev - предыдущее значение таймера

        // Если таймер дошел до 1 секунды
        if (prev <= 1) {
          // Если текущая фаза - прием ставок
          if (phase === 'betting') {
            // Переключаемся на фазу прокрутки
            setPhase('spinning');
            // Запускаем функцию прокрутки рулетки
            spinRoulette();
            // Возвращаем любое значение (оно не используется, т.к. таймер скрыт)
            return 0;
          }
        }

        // Уменьшаем таймер на 1 секунду
        return prev - 1;
      });
    }, 1000); // 1000 миллисекунд = 1 секунда

    // Cleanup функция - выполняется при размонтировании компонента
    // Очищает интервал, чтобы избежать утечек памяти
    return () => clearInterval(interval);
  }, [phase]); // Зависимость от phase - эффект перезапускается при изменении фазы

  // Функция прокрутки рулетки
  const spinRoulette = () => {
    // Генерируем случайный индекс победителя
    // Math.random() дает число от 0 до 1
    // Умножаем на длину массива items
    // Math.floor() округляет вниз до целого числа
    const winnerIndex = Math.floor(Math.random() * 10);

    // Ширина одного элемента рулетки в пикселях
    const itemWidth = 200;

    // Количество полных оборотов рулетки для эффектности
    const fullRotations = 8;

    // Вычисляем финальную позицию смещения в пикселях
    // (количество оборотов * количество элементов * ширина элемента) +
    // (индекс победителя * ширина) +
    // (половина ширины для центрирования на указателе)
    const finalPosition = (fullRotations * 10 * itemWidth) + (winnerIndex * itemWidth) + itemWidth / 2;

    // Устанавливаем смещение - это запустит CSS анимацию
    setOffset(finalPosition);

    // Устанавливаем таймер на 5 секунд (время прокрутки)
    // setTimeout выполнит функцию через указанное время
    setTimeout(() => {
      // Устанавливаем победителя


      // Переключаемся на фазу показа результата
      setPhase('result');

      // Устанавливаем таймер на 10 секунд для показа результата
      setTimer(5);
    }, 5000); // 5000 миллисекунд = 5 секунд
  };

  // Функция для начала нового раунда
  const startNewRound = () => {
    // Сбрасываем фазу на прием ставок
    setPhase('betting');

    // Сбрасываем смещение рулетки в начальную позицию
    setOffset(0);

    // Очищаем победителя
    setWinner([]);

    // Устанавливаем таймер на 30 секунд
    setTimer(30);
  };

  // useEffect для отслеживания фазы результата
  useEffect(() => {
    // Если фаза - показ результата
    if (phase === 'result') {
      // Через 10 секунд запускаем новый раунд
      const timeout = setTimeout(() => {
        startNewRound();
      }, 10000); // 10000 мс = 10 секунд

      // Cleanup - очистка таймера при размонтировании
      return () => clearTimeout(timeout);
    }
  }, [phase]); // Зависимость от phase

  // Возвращаем JSX разметку компонента
  return (
    <div className="min-h-screen p-8">
      {/* Контейнер с максимальной шириной, центрированный */}
      <div className="max-w-7xl mx-auto">

        {/* Верхняя информационная панель */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between">

            {/* Левая часть - таймер (показывается только во время ставок) */}
            <div className="text-white">
              {/* Условный рендеринг - показываем таймер только если фаза betting */}
              {phase === 'betting' && (
                <>
                  {/* Контейнер для иконки и времени */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* Иконка таймера, размер 8x8 (32px) */}
                    <Timer className="w-8 h-8"/>
                    {/* Время - tabular-nums делает цифры моноширинными для красивого тикания */}
                    <span className="text-4xl tabular-nums">{timer}s</span>
                  </div>
                  {/* Текст под таймером */}
                  <p className="opacity-80">Время для ставок</p>
                </>
              )}

              {/* Если фаза - прокрутка, показываем текст без таймера */}
              {phase === 'spinning' && (
                <p className="text-2xl">Рулетка крутится...</p>
              )}

              {/* Если фаза - результат, показываем текст */}
              {phase === 'result' && (
                <p className="text-2xl">Победитель определён!</p>
              )}
            </div>

            {/* Правая часть - банк */}
            <div className="text-right text-white">
              {/* Иконка и заголовок */}
              <div className="flex items-center gap-2 justify-end mb-2">
                <TrendingUp className="w-6 h-6"/>
                <span className="text-sm opacity-80">Банк:</span>
              </div>
              {/* Сумма банка с 2 знаками после запятой */}
              <p className="text-4xl">${totalPot.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Блок с результатом победителя */}
        {/* Условный рендеринг - показываем только если есть победитель И фаза result */}
        {winner && phase === 'result' && (
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 mb-8 text-center animate-pulse shadow-2xl">
            {/* Заголовок */}
            <h2 className="text-white mb-4">🎉 Выигрышный предмет 🎉</h2>
            {/* Карточка с предметом-победителем */}
            <div className={`inline-block bg-gradient-to-br rounded-lg p-6 text-white shadow-xl`}>
              {/* Название предмета */}
              <p className="text-3xl mb-2">{winner.name}</p>
              {/* Цена */}
              <p className="text-2xl">${playmates[0][0]}</p>
            </div>
          </div>
        )}

        {/* Контейнер рулетки */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 mb-8 shadow-2xl border border-white/10">
          {/* Внутренний контейнер с overflow-hidden для скрытия прокрутки */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 p-6">

            {/* Центральный указатель (желтая линия и треугольник) */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-[0_0_20px_rgba(250,204,21,0.8)]">
              {/* Треугольник-указатель сверху */}
              {/* Создается с помощью border trick в CSS */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
            </div>

            {/* Прокручиваемая лента с предметами */}
            <div
              ref={containerRef} // Ссылка на DOM элемент
              className="flex gap-4" // Flexbox с gap 4 (16px) между элементами
              style={{
                // CSS transform для смещения ленты влево
                transform: `translateX(-${offset}px)`,
                // Если фаза spinning - применяем плавную анимацию 5 секунд
                // cubic-bezier - кривая анимации (начинается медленно, ускоряется, замедляется)
                // Если не spinning - анимации нет (моментальный переход)
                transition: phase === 'spinning' ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              {/* Проходимся по массиву повторяющихся предметов */}
              {repeatedItems.map((item, index) => (
                // Каждый элемент рулетки
                // key - уникальный идентификатор для React (id предмета + индекс)
                <div
                  key={`${item.id}-${index}`}
                  className={`min-w-[200px] h-40 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg border-2 border-white/20`}
                >
                  {/* Аватар игрока */}
                  {item.photo && (
                    <img
                      src={item.photo}
                      alt={item.username}
                      className="w-16 h-16 rounded-full mb-2 border-2 border-white/50 object-cover"
                    />
                  )}
                  {/* Имя игрока */}
                  <p className="text-center px-3 mb-1">{item.username}</p>
                  {/* Ставка */}
                  <p className="text-xl">${item.bet}</p>
                  {/* Процент */}
                  <div className="text-xs opacity-70 mt-1">{item.percentage?.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Список ставок пользователей */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/10">
          {/* Заголовок секции */}
          <h2 className="text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">👥</span> Ставки игроков
          </h2>

          {/* Контейнер со списком - space-y-3 добавляет отступ 12px между элементами */}
          <div className="space-y-3">
            {/* Проходимся по массиву пользователей */}
            {playmates.map((user, index) => (
              // Карточка пользователя
              <div
                key={index} // Уникальный ключ для React
                className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 flex items-center justify-between hover:from-blue-800/60 hover:to-purple-800/60 transition-all border border-white/5"
              >
                {/* Левая часть - аватар и информация */}
                <div className="flex items-center gap-4">
                  {/* Аватар пользователя (круглый) */}
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-blue-400 object-cover"
                    />
                  )}

                  {/* Имя и предмет */}
                  <div>
                    {/* Имя пользователя */}
                    <p className="text-white">{user.username}</p>
                    {/* Название предмета на который сделана ставка */}
                    <p className="text-yellow-400 text-sm">{user.percentage.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Правая часть - сумма и шанс */}
                <div className="text-right">
                  {/* Сумма ставки */}
                  <p className="text-green-400">${user.bet}</p>
                  {/* Процент шанса выигрыша с 2 знаками после запятой */}
                  {/*<p className="text-blue-300 text-sm">{user.chance.toFixed(2)}% шанс</p>*/}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
