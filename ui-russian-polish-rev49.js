/* CHAIKA rev49 — Russian-only visible product labels for investor demo. */
(() => {
  const translate = () => {
    const profile = document.getElementById('profileUsername');
    if (profile && profile.textContent.trim() === 'Telegram Mini App') profile.textContent = 'Приложение Telegram';

    document.querySelectorAll('.chaika-admin-badge').forEach(el => {
      const value = el.textContent.trim().toUpperCase();
      if (value === 'ADMIN') el.textContent = 'АДМИН';
      if (value === 'MODERATOR') el.textContent = 'МОДЕРАТОР';
    });
  };

  translate();
  const observer = new MutationObserver(translate);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
