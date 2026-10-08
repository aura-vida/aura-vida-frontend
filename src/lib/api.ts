const API_URL = "https://witch-edges-sir-functions.trycloudflare.com";

export const ACCESS_TOKEN_KEY = "aura_access_token";
export const REFRESH_TOKEN_KEY = "aura_refresh_token";

export const getApiUrl = () => API_URL;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

let refreshPromise: Promise<string | null> | null = null;

export async function api<T = unknown>(path: string, options: ApiOptions = {}, isRetry = false): Promise<T> {

  // Wait if another request is currently refreshing the token
  if (refreshPromise && !path.includes("/api/auth/refresh")) {
    const newToken = await refreshPromise;
    if (newToken && options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.set("Authorization", `Bearer ${newToken}`);
      } else if (Array.isArray(options.headers)) {
        // Not handled cleanly, but fallback
      } else {
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
    if (response.status === 401 && !isRetry && !path.includes("/api/auth/login") && !path.includes("/api/auth/refresh")) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        if (!refreshPromise) {
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
                  localStorage.setItem(ACCESS_TOKEN_KEY, refreshData.session.access_token);
                  if (refreshData.session.refresh_token) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, refreshData.session.refresh_token);
                  }
                  return refreshData.session.access_token as string;
                }
              }
              // If refresh fails, purge auth state
              localStorage.removeItem(ACCESS_TOKEN_KEY);
              localStorage.removeItem(REFRESH_TOKEN_KEY);
              return null;
            })
            .catch(() => null)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        if (newToken) {
          // Replay the request with the new token
          headers.set("Authorization", `Bearer ${newToken}`);
          return api<T>(path, { ...options, headers }, true);
        }
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
