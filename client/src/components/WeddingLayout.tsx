import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  Heart,
  LayoutDashboard,
  Users,
  Mail,
  Palette,
  Armchair,
  Globe,
  Settings,
} from "lucide-react";

interface WeddingLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { label: "דשבורד", path: "/", icon: LayoutDashboard },
  { label: "מוזמנים", path: "/guests", icon: Users },
  { label: "הזמנות", path: "/invitations", icon: Mail },
  { label: "עיצובים וטקסטים", path: "/designs", icon: Palette },
  { label: "סידורי ישיבה", path: "/seating", icon: Armchair },
  { label: "אתר האורחים", path: "/rsvp", icon: Globe },
  { label: "הגדרות", path: "/settings", icon: Settings },
];

export default function WeddingLayout({ children }: WeddingLayoutProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 z-40 h-full w-60 transform bg-card border-l border-border shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-5 flex-row-reverse">
            <Heart className="w-5 h-5 text-accent shrink-0" />
            <h1 className="text-lg font-bold text-foreground">WeddingOS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t border-border px-3 py-3">
            <div className="mb-3 px-2 text-right">
              <p className="text-xs text-muted-foreground">מחובר כ-</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || user?.email || "משתמש"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 flex-row-reverse text-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              התנתקות
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Top Bar */}
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between md:hidden">
          <Heart className="w-5 h-5 text-accent" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-6xl py-6 px-4 md:px-6">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
