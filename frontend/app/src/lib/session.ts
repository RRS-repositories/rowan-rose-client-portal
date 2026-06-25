/** Session JWT store. Kept in sessionStorage so it survives a same-tab refresh
 *  (matches the AuthProvider's session model) but not a new tab or closed
 *  browser. The API client reads this to authorise /client/* requests. */
const TOKEN_KEY = "rr-token";

export const getToken = (): string | null => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null): void => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) — auth simply won't persist */
  }
};
