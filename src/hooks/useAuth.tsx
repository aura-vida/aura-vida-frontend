import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  type AuthProfile,
  type AuthResult,
  type AuthSession,
  type AuthUser,
  clearAuth,
  loadStoredAuth,
  loginUser,
  logoutUser,
  persistAuth,
  registerUser,
  sendOtp as sendOtpRequest,
  verifyOtp as verifyOtpRequest,
  requestPasswordReset as requestPasswordResetRequest,
  resetPassword as resetPasswordRequest,
} from "@/lib/authApi";
import {
  api,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  AUTH_SESSION_KEY,
  isTokenExpiringSoon,
  getTokenExpiresIn,
  refreshAccessToken,
} from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (payload: { email: string; password: string; name: string }) => Promise<AuthResult>;
  sendOtp: (identifier: string) => Promise<{ message: string }>;
  verifyOtp: (identifier: string, otp: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, email: string, password: string) => Promise<{ message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ user: null, profile: null, session: null }),
  signUp: async () => ({ user: null, profile: null, session: null }),
  sendOtp: async () => ({ message: "" }),
  verifyOtp: async () => ({ user: null, profile: null, session: null }),
  requestPasswordReset: async () => ({ message: "" }),
  resetPassword: async () => ({ message: "" }),
  signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((result: AuthResult) => {
    if (result.session?.access_token && result.user) {
      persistAuth(result);
      setUser(result.user);
      setProfile(result.profile);
      setSession(result.session);
      return result;
    }
    return result;
  }, []);

  useEffect(() => {
    // 1. Handle magic link token in URL hash
    if (window.location.hash.includes("access_token=")) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken) {
        // Temporarily store it so api() calls work
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

        // Remove hash from URL for cleaner UI
        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        // Fetch user profile using the new token
        api<{ profile: AuthProfile }>("/api/users/me")
          .then((res) => {
            // Minimal JWT payload decoding to extract ID and email (Supabase formats them this way)
            const jwtPayload = JSON.parse(atob(accessToken.split('.')[1]));
            const userObj = { id: jwtPayload.sub, email: jwtPayload.email };

            applyAuth({
              user: userObj,
              profile: res.profile,
              session: { access_token: accessToken, refresh_token: refreshToken }
            });
            setLoading(false);
          })
          .catch((err) => {
            console.error("Failed to login from magic link", err);
            clearAuth();
            setLoading(false);
          });
        return; // Don't load stored auth below, wait for API
      }
    }

    // 2. Normal load for returning users: re-verify session with /api/users/me
    const stored = loadStoredAuth();
    if (stored.session?.access_token && stored.user) {
      setUser(stored.user);
      setProfile(stored.profile);
      setSession(stored.session);

      // Verify the token with the server
      api<{ profile: AuthProfile }>("/api/users/me")
        .then((res) => {
          if (res?.profile) {
            setProfile(res.profile);
            persistAuth({
              user: stored.user,
              profile: res.profile,
              session: stored.session,
            });
          }
        })
        .catch((err) => {
          console.warn("Session expired or invalid on startup:", err);
          clearAuth();
          setUser(null);
          setProfile(null);
          setSession(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      clearAuth();
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    }
  }, [applyAuth]);

  // 3. Global listener for unrecoverable 401 unauthorized events from api.ts
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    };

    window.addEventListener("aura:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("aura:unauthorized", handleUnauthorized);
    };
  }, []);

  // 4. Proactive background auto-refresh timer: automatically refreshes token before expiry
  useEffect(() => {
    if (!session?.access_token) return;

    const expiresInSeconds = getTokenExpiresIn(session.access_token);
    if (expiresInSeconds <= 0) return;

    // Refresh 3 minutes (180s) before expiry, or after 10s if already expiring soon
    const refreshDelayMs = Math.max(10000, (expiresInSeconds - 180) * 1000);

    const timer = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (err) {
        console.warn("Background auto-refresh attempt:", err);
      }
    }, refreshDelayMs);

    return () => clearTimeout(timer);
  }, [session?.access_token]);

  // 5. Auto-refresh when tab becomes visible or focused after laptop sleep/tab switch
  useEffect(() => {
    const checkAndRefresh = async () => {
      if (document.visibilityState === "visible") {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (token && refresh && isTokenExpiringSoon(token, 120)) {
          await refreshAccessToken();
        }
      }
    };

    document.addEventListener("visibilitychange", checkAndRefresh);
    window.addEventListener("focus", checkAndRefresh);
    return () => {
      document.removeEventListener("visibilitychange", checkAndRefresh);
      window.removeEventListener("focus", checkAndRefresh);
    };
  }, []);

  // 6. Listen for token refresh events emitted by api.ts to keep in-memory session fresh
  useEffect(() => {
    const onTokenRefreshed = (e: Event) => {
      const custom = e as CustomEvent<{ access_token: string; refresh_token: string }>;
      if (custom.detail?.access_token) {
        setSession((prev) =>
          prev
            ? { ...prev, access_token: custom.detail.access_token, refresh_token: custom.detail.refresh_token }
            : { access_token: custom.detail.access_token, refresh_token: custom.detail.refresh_token }
        );
      }
    };

    window.addEventListener("aura:token_refreshed", onTokenRefreshed);
    return () => {
      window.removeEventListener("aura:token_refreshed", onTokenRefreshed);
    };
  }, []);

  // 7. Cross-tab storage synchronization
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY || e.key === AUTH_SESSION_KEY) {
        const stored = loadStoredAuth();
        if (stored.session?.access_token && stored.user) {
          setUser(stored.user);
          setProfile(stored.profile);
          setSession(stored.session);
        } else if (!stored.session?.access_token) {
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    if (!result.session?.access_token || !result.user) {
      throw new Error(result.message ?? "Could not sign in.");
    }

    // Explicitly call /me API to satisfy user request for fresh profile data on login
    // First, persist the token so the API request succeeds
    localStorage.setItem(ACCESS_TOKEN_KEY, result.session.access_token);
    try {
      const meData = await api<{ profile: AuthProfile }>("/api/users/me");
      result.profile = meData.profile;
    } catch (e) {
      console.error("Failed to fetch fresh /me data during login", e);
    }

    return applyAuth(result);
  };

  const signUp = async (payload: { email: string; password: string; name: string }) => {
    const result = await registerUser(payload);
    if (result.session?.access_token && result.user) {
      return applyAuth(result);
    }
    return result;
  };

  const sendOtp = (identifier: string) => sendOtpRequest(identifier);

  const requestPasswordReset = (email: string) => requestPasswordResetRequest(email);

  const resetPassword = (token: string, email: string, password: string) =>
    resetPasswordRequest(token, { email, password });

  const verifyOtp = async (identifier: string, otp: string) => {
    const result = await verifyOtpRequest({ identifier, otp });
    if (!result.session?.access_token || !result.user) {
      throw new Error(result.message ?? "Could not verify the code.");
    }
    return applyAuth(result);
  };

  const signOut = async () => {
    try {
      await logoutUser();
    } catch {
      // Still clear the local session if the API is unreachable.
    }
    clearAuth();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        sendOtp,
        verifyOtp,
        requestPasswordReset,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
