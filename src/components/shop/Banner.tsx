import React, { useEffect, useState } from 'react';

const MovieBanner = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const phrases = [
    "🎬 Кино — это магия",
    "🌙 Вечерний сеанс",
    "🍿 Запасись попкорном",
    "✨ Погрузись в историю",
    "🎭 Эмоции на экране"
  ];

  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="movie-banner">
      {/* Анимированный градиентный фон */}
      <div className="banner-gradient"></div>

      {/* Плавающие элементы */}
      <div className="floating-elements">
        <div className="floating-element popcorn">🍿</div>
        <div className="floating-element clapper">🎬</div>
        <div className="floating-element film">🎞️</div>
        <div className="floating-element star">⭐</div>
      </div>

      {/* Основной контент */}
      <div className="banner-content">
        <h1
          className="banner-title"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        >
          <span className="title-gradient">Кино под звёздами</span>
        </h1>

        <div className="banner-phrase">
          {phrases[currentPhrase]}
        </div>

        <div className="banner-buttons">
          <button className="banner-btn primary">
            <span>🎥 Смотреть сейчас</span>
          </button>
          <button className="banner-btn secondary">
            <span>📅 Афиша</span>
          </button>
        </div>
      </div>

      {/* Бегущая строка с фильмами */}
      <div className="ticker">
        <div className="ticker-content">
          {['Дюна', 'Оппенгеймер', 'Барби', 'Начало', 'Интерстеллар', 'Матрица', 'Аватар', 'Такси'].map((movie, i) => (
            <span key={i} className="ticker-item">{movie}</span>
          ))}
          {['Дюна', 'Оппенгеймер', 'Барби', 'Начало', 'Интерстеллар', 'Матрица', 'Аватар', 'Такси'].map((movie, i) => (
            <span key={i + 100} className="ticker-item">{movie}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieBanner;