const API_URL = "https://e0cc-120-72-93-46.ngrok-free.app";

export const ACCESS_TOKEN_KEY = "aura_access_token";

export const getApiUrl = () => API_URL;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {


  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Tunnel-Skip-AntiPhishing-Page", "True");
  headers.set("ngrok-skip-browser-warning", "true");

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export const pingBackend = () =>
  fetch(`${API_URL}/`, {
    headers: {
      Accept: "text/plain",
      "X-Tunnel-Skip-AntiPhishing-Page": "True",
      "ngrok-skip-browser-warning": "true",
    },
  }).then((res) => res.text());
