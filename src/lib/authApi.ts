import { api, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/api";

export const AUTH_USER_KEY = "aura_auth_user";
export const AUTH_PROFILE_KEY = "aura_auth_profile";
export const AUTH_SESSION_KEY = "aura_auth_session";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthProfile = {
  id?: string;
  full_name: string | null;
  phone: string | null;
  practitioner_slug: string | null;
  referral_code: string | null;
  credit_inr: number | null;
  role?: string | null;
  status?: string | null;           // e.g. 'active', 'suspended'
  referred_by?: string | null;      // UUID of referrer
  created_at?: string | null;
  updated_at?: string | null;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string | null;
  expires_in?: number;
  token_type?: string;
};

export type AuthResult = {
  message?: string;
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
};

type BackendAuthResponse = {
  message?: string;
  user?: {
    id?: string;
    email?: string;
    profile?: AuthProfile | null;
  } | null;
  session?: AuthSession | null;
};

const toAuthResult = (data: BackendAuthResponse): AuthResult => {
  const raw = data.user;
  const user =
    raw?.id && raw?.email
      ? { id: raw.id, email: raw.email }
      : null;
  return {
    message: data.message,
    user,
    profile: raw?.profile ?? null,
    session: data.session ?? null,
  };
};

export const loadStoredAuth = (): AuthResult => {
  try {
    const userRaw = localStorage.getItem(AUTH_USER_KEY);
    const profileRaw = localStorage.getItem(AUTH_PROFILE_KEY);
    const sessionRaw = localStorage.getItem(AUTH_SESSION_KEY);
    return {
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
      profile: profileRaw ? (JSON.parse(profileRaw) as AuthProfile) : null,
      session: sessionRaw ? (JSON.parse(sessionRaw) as AuthSession) : null,
    };
  } catch {
    return { user: null, profile: null, session: null };
  }
};

export const persistAuth = (result: AuthResult) => {
  if (result.session?.access_token && result.user) {
    localStorage.setItem(ACCESS_TOKEN_KEY, result.session.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, result.session.refresh_token ?? "");
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
    localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(result.profile));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(result.session));
    return;
  }
  clearAuth();
};

export const clearAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_PROFILE_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
};

export const registerUser = async (payload: {
  email: string;
  password: string;
  name: string;
  role?: "Customer" | "Practitioner" | "Admin";
  referral_code?: string;
}) => {
  const data = await api<BackendAuthResponse>("/api/auth/register", {
    method: "POST",
    body: {
      email: payload.email,
      password: payload.password,
      name: payload.name,
      role: payload.role ?? "Customer",
      referral_code: payload.referral_code,
    },
  });
  return toAuthResult(data);
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const data = await api<BackendAuthResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
  return toAuthResult(data);
};

export const logoutUser = () =>
  api<{ message: string }>("/api/auth/logout", { method: "POST" });

export const sendOtp = (identifier: string) =>
  api<{ message: string }>("/api/auth/send-otp", {
    method: "POST",
    body: { identifier },
  });

export const verifyOtp = async (payload: { identifier: string; otp: string }) => {
  const data = await api<BackendAuthResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: payload,
  });
  return toAuthResult(data);
};

export const requestPasswordReset = (email: string) =>
  api<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });

export const resetPassword = (token: string, payload: { email: string; password: string }) =>
  api<{ message: string }>(`/api/auth/reset-password/${encodeURIComponent(token)}`, {
    method: "POST",
    body: payload,
  });
