const ACCESS_TOKEN_KEY = "amiglot_access_token";
const USER_ID_KEY = "amiglot_user_id";

function setSessionCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

function clearSessionCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  setSessionCookie(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  clearSessionCookie(ACCESS_TOKEN_KEY);
}

export function getUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(USER_ID_KEY);
}

export function setUserId(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_ID_KEY, userId);
  setSessionCookie(USER_ID_KEY, userId);
}

export function clearUserId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_ID_KEY);
  clearSessionCookie(USER_ID_KEY);
}
