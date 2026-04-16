import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Heart } from "lucide-react";
import {
  BarChart3,
  Users,
  Mail,
  CheckSquare,
  Armchair,
  DollarSign,
  Clock,
  Image,
} from "lucide-react";

interface WeddingLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { label: "דשבורד", path: "/", icon: BarChart3 },
  { label: "מוזמנים", path: "/guests", icon: Users },
  { label: "הזמנות", path: "/invitations", icon: Mail },
  { label: "אישורי הגעה", path: "/rsvp", icon: CheckSquare },
  { label: "סידורי ישיבה", path: "/seating", icon: Armchair },
  { label: "תקציב", path: "/budget", icon: DollarSign },
  { label: "לוח זמנים", path: "/timeline", icon: Clock },
  { label: "גלריה", path: "/gallery", icon: Image },
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
        className={`fixed right-0 top-0 z-40 h-full w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center gap-3 border-b border-border px-6 py-6 flex-row-reverse">
            <Heart className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold text-foreground">חתונה</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t border-border px-4 py-4">
            <div className="mb-4 px-2 text-right">
              <p className="text-sm text-muted-foreground">כניסה בתור</p>
              <p className="font-semibold text-foreground truncate">
                {user?.name || user?.email || "משתמש"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 flex-row-reverse"
            >
              <LogOut className="w-4 h-4" />
              התנתקות
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between md:justify-start flex-row-reverse">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-8">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Close button overlay for mobile */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 right-4 z-50 md:hidden text-foreground hover:text-accent"
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
