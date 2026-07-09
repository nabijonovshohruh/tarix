// The official telegram-web-app.js script (loaded in index.html) always
// defines window.Telegram.WebApp, even outside the real Telegram client —
// but initData stays empty there. We use that as the signal that we're
// running in a plain browser during development, and switch the API client
// to the dev-auth header scheme instead of the tma initData scheme.
const initData = window.Telegram?.WebApp?.initData;
if (import.meta.env.DEV && !initData) {
  window.__TARIX_MOCK__ = true;
}
