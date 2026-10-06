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
  signOut: async () => {},
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
    const stored = loadStoredAuth();
    if (stored.session?.access_token && stored.user) {
      setUser(stored.user);
      setProfile(stored.profile);
      setSession(stored.session);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    if (!result.session?.access_token || !result.user) {
      throw new Error(result.message ?? "Could not sign in.");
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
