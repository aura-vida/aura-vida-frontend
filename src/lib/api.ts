const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const ACCESS_TOKEN_KEY = "aura_access_token";
export const REFRESH_TOKEN_KEY = "aura_refresh_token";
export const AUTH_USER_KEY = "aura_auth_user";
export const AUTH_PROFILE_KEY = "aura_auth_profile";
export const AUTH_SESSION_KEY = "aura_auth_session";

export const clearStoredAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_PROFILE_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
};

export const getApiUrl = () => API_URL;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export const isTokenExpiringSoon = (token: string | null, thresholdSeconds = 90): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp - nowSeconds < thresholdSeconds;
  } catch {
    return true;
  }
};

export const getTokenExpiresIn = (token: string | null): number => {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return 0;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - nowSeconds);
  } catch {
    return 0;
  }
};

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    clearStoredAuthTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("aura:unauthorized", { detail: { path: "/api/auth/refresh" } }));
    }
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      if (res.ok) {
        const refreshData = await res.json();
        if (refreshData.session?.access_token) {
          const newAccess = refreshData.session.access_token as string;
          const newRefresh = (refreshData.session.refresh_token as string) || refreshToken;

          localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);

          try {
            const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
            if (rawSession) {
              const parsed = JSON.parse(rawSession);
              parsed.access_token = newAccess;
              parsed.refresh_token = newRefresh;
              localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
            }
          } catch (_) {}

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("aura:token_refreshed", {
                detail: { access_token: newAccess, refresh_token: newRefresh },
              })
            );
          }
          return newAccess;
        }
      }

      // If refresh fails, completely purge auth state & notify app
      clearStoredAuthTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("aura:unauthorized", { detail: { path: "/api/auth/refresh" } }));
      }
      return null;
    })
    .catch(() => {
      clearStoredAuthTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("aura:unauthorized", { detail: { path: "/api/auth/refresh" } }));
      }
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}, isRetry = false): Promise<T> {
  const isAuthRoute = path.includes("/api/auth/login") || path.includes("/api/auth/refresh");

  // Proactive pre-flight refresh: if token is expiring within 90 seconds, silently refresh it before making request
  if (!isAuthRoute) {
    const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const currentRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (currentToken && currentRefresh && isTokenExpiringSoon(currentToken, 90)) {
      await refreshAccessToken();
    }
  }

  // Wait if another request is currently refreshing the token
  if (refreshPromise && !path.includes("/api/auth/refresh")) {
    const newToken = await refreshPromise;
    if (newToken && options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.set("Authorization", `Bearer ${newToken}`);
      } else if (!Array.isArray(options.headers)) {
        (options.headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
      }
    }
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Tunnel-Skip-AntiPhishing-Page", "True");
  headers.set("ngrok-skip-browser-warning", "true");

  if (options.body !== undefined && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined 
      ? (options.body instanceof FormData ? options.body : JSON.stringify(options.body))
      : undefined,
  });

  const text = await response.text();
  let data: T | undefined;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      throw new Error("Unexpected response from the server.");
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !isRetry && !isAuthRoute) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Transparently replay the request with the fresh token
        headers.set("Authorization", `Bearer ${newToken}`);
        return api<T>(path, { ...options, headers }, true);
      }
    }

    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export const pingBackend = () =>
  fetch(`${API_URL}/`, {
    headers: {
      Accept: "text/plain",
      "X-Tunnel-Skip-AntiPhishing-Page": "True",
      "ngrok-skip-browser-warning": "true",
    },
  }).then((res) => res.text());
