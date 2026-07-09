export function getWebApp() {
  return window.Telegram?.WebApp;
}

export function initWebApp() {
  const wa = getWebApp();
  wa?.ready();
  wa?.expand();
}

export function getColorScheme(): "light" | "dark" {
  return getWebApp()?.colorScheme ?? "light";
}

export function onThemeChange(cb: () => void) {
  getWebApp()?.onEvent("themeChanged", cb);
}

export function isMockMode(): boolean {
  return Boolean(window.__TARIX_MOCK__);
}

export function hapticSuccess() {
  getWebApp()?.HapticFeedback?.notificationOccurred("success");
}

export function hapticError() {
  getWebApp()?.HapticFeedback?.notificationOccurred("error");
}
