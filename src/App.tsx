import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import YouTubeToShort from "./pages/YouTubeToShort";
import VideoToGIF from "./pages/VideoToGIF";
import VideoCompressor from "./pages/VideoCompressor";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import FormatConverter from "./pages/FormatConverter";
import YouTubeDownloader from "./pages/YouTubeDownloader";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <footer className="border-t border-border bg-muted/30 py-8 mt-auto">
      <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} VideoConvert Pro · Free online video converter · All files deleted after 24h</p>
      </div>
    </footer>
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth pages (no layout) */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Main app with layout */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/youtube-to-short" element={<Layout><YouTubeToShort /></Layout>} />
              <Route path="/video-to-gif" element={<Layout><VideoToGIF /></Layout>} />
              <Route path="/video-compressor" element={<Layout><VideoCompressor /></Layout>} />
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/youtube-downloader" element={<Layout><YouTubeDownloader /></Layout>} />
              <Route path="/:format-converter" element={<Layout><FormatConverter /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
