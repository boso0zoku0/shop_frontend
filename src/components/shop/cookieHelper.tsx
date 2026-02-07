/**
 * Устанавливает куку session_id в браузере
 * @param sessionId - ID сессии из бэкенда
 */
export function setSessionCookie(sessionId: string) {
  // Устанавливаем куку с параметрами безопасности
  document.cookie = `session_id=${sessionId}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`; // 7 дней

  // Также сохраняем в localStorage для резервного доступа
  localStorage.setItem('cookie_session_id', sessionId);

  console.log('Session cookie установлена:', sessionId);
}

/**
 * Получает session_id из куки или localStorage
 * @returns session_id или null
 */
export function getSessionId(): string | null {
  // Сначала пытаемся получить из куки
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'session_id') {
      return value;
    }
  }

  // Если в куке нет, берём из localStorage
  return localStorage.getItem('cookie_session_id');
}

/**
 * Удаляет session_id из куки и localStorage
 */
export function clearSessionCookie() {
  document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.removeItem('cookie_session_id');
  console.log('Session cookie удалена');
}