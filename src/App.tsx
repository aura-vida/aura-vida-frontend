import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Guides from "./pages/Guides.tsx";
import ValuesPage from "./pages/Values.tsx";
import Book from "./pages/Book.tsx";
import AuthPage from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Account from "./pages/Account.tsx";
import PractitionerArea from "./pages/PractitionerArea.tsx";
import Admin from "./pages/Admin.tsx";
import ListSpace from "./pages/ListSpace.tsx";

import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/values" element={<ValuesPage />} />
            <Route path="/book" element={<Book />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/practitioner" element={<PractitionerArea />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/list-your-space" element={<ListSpace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
