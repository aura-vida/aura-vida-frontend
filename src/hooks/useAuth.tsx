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
import { api, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/api";

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

    // 2. Normal load for returning users
    const stored = loadStoredAuth();
    if (stored.session?.access_token && stored.user) {
      setUser(stored.user);
      setProfile(stored.profile);
      setSession(stored.session);
    }
    setLoading(false);
  }, [applyAuth]);

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
