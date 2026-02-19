import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, X, Video, Scissors, Zap, LogIn, User, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS_MENU = [
  { href: "/", label: "Video Converter", icon: Video, desc: "Convert any video format" },
  { href: "/youtube-to-short", label: "YouTube to Short", icon: Scissors, desc: "Clip YouTube videos for TikTok / Reels" },
  { href: "/video-to-gif", label: "Video to GIF", icon: Zap, desc: "Convert video to animated GIF" },
  { href: "/video-compressor", label: "Compress Video", icon: Zap, desc: "Reduce video file size" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Video className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg">
              <span className="text-gradient">VideoConvert</span>
              <span className="text-foreground"> Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Convert
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Tools <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {TOOLS_MENU.map(item => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link to={item.href} className="flex items-start gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/youtube-to-short"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/youtube-to-short") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              YouTube Clipper
            </Link>
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user.email?.split("@")[0]}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" className="gradient-primary border-0 text-white" asChild>
                  <Link to="/signup">
                    <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign Up Free
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container px-4 py-3 space-y-1">
            {TOOLS_MENU.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border flex gap-2">
              {user ? (
                <>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="text-destructive">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" className="gradient-primary border-0 text-white flex-1" asChild>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
