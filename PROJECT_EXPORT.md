# WeddingOS - Complete Project Export

**Project:** Hebrew Wedding Planning System
**Language:** Hebrew (עברית) with RTL Support
**Framework:** React 19 + Tailwind 4 + Express 4 + tRPC 11
**Database:** MySQL with Drizzle ORM
**Status:** Production Ready

---

## TABLE OF CONTENTS

1. Main App Files
2. Pages
3. Components
4. Hooks
5. Styles
6. Server Files (Key Routers)

---

## ===== FILE: client/src/App.tsx =====

```tsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import WeddingLayout from "./components/WeddingLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import Invitations from "./pages/Invitations";
import RSVPSummary from "./pages/RSVPSummary";
import Seating from "./pages/Seating";
import Budget from "./pages/Budget";
import Timeline from "./pages/Timeline";
import Gallery from "./pages/Gallery";
import GuestRSVP from "./pages/GuestRSVP";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/guest-rsvp/:token"}>
        {(params) => <GuestRSVP token={params.token} />}
      </Route>
      <Route component={WeddingLayout}>
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/guests"} component={Guests} />
        <Route path={"/invitations"} component={Invitations} />
        <Route path={"/rsvp"} component={RSVPSummary} />
        <Route path={"/seating"} component={Seating} />
        <Route path={"/budget"} component={Budget} />
        <Route path={"/timeline"} component={Timeline} />
        <Route path={"/gallery"} component={Gallery} />
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

---

## ===== FILE: client/src/main.tsx =====

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { trpc } from "./lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
```

---

## ===== FILE: client/src/lib/trpc.ts =====

```ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
```

---

## ===== FILE: client/src/pages/Home.tsx =====

```tsx
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import HebrewHome from "./HebrewHome";
import Dashboard from "./Dashboard";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return <HebrewHome />;
}
```

---

## ===== FILE: client/src/pages/HebrewHome.tsx =====

```tsx
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function HebrewHome() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              מתכננים חתונה?
            </h1>
            <h2 className="text-5xl md:text-6xl font-bold text-accent leading-tight">
              הכל במקום אחד.
            </h2>
          </div>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ניהול מוזמנים, אישורי הגעה, סידורי ישיבה והזמנות – בקלות ובפשטות.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={() => navigate("/guest-rsvp/demo-token-12345")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-medium"
            >
              נסו דוגמה
            </Button>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              variant="outline"
              className="px-8 py-6 text-lg font-medium"
            >
              התחילו עכשיו
            </Button>
          </div>

          <div className="pt-12 text-sm text-muted-foreground">
            <p>💍 מערכת ניהול חתונות בעברית</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Dashboard.tsx =====

```tsx
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Heart, Users, CheckCircle, XCircle } from "lucide-react";

const MEAL_COLORS = {
  regular: "#a4d4ae",
  vegetarian: "#f4a6a6",
  vegan: "#b8d4f1",
  glutenFree: "#f4d4a6",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: rsvpData, isLoading } = trpc.rsvp.list.useQuery();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const stats = rsvpData || {
    totalInvited: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    totalAttending: 0,
    mealBreakdown: {},
  };

  const rsvpChartData = [
    { name: "אישרו הגעה", value: stats.confirmed, fill: "#a4d4ae" },
    { name: "לא מגיעים", value: stats.declined, fill: "#f4a6a6" },
    { name: "בהמתנה", value: stats.pending, fill: "#d4c4f1" },
  ];

  const mealChartData = Object.entries(stats.mealBreakdown || {}).map(([key, value]: any) => ({
    name: key === "regular" ? "רגיל" : key === "vegetarian" ? "צמחוני" : key === "vegan" ? "טבעוני" : "חסר גלוטן",
    value: value,
    fill: MEAL_COLORS[key as keyof typeof MEAL_COLORS] || "#a4d4ae",
  }));

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">דשבורד</h1>
        <p className="text-muted-foreground">סקירה כללית של החתונה שלכם</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">בחתימה</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalInvited}</p>
              </div>
              <Heart className="w-8 h-8 text-accent opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 border-accent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סך מוזמנים</p>
                <p className="text-3xl font-bold text-accent">{stats.totalInvited}</p>
              </div>
              <Users className="w-8 h-8 text-accent opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">אישרו הגעה</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סך מגיעים כולל מלווים</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalAttending}</p>
              </div>
              <Users className="w-8 h-8 text-accent opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSVP Status Chart */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">מי מגיע?</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rsvpChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#a4d4ae" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Meal Preferences Chart */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">מה כולם אוכלים?</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mealChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mealChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Meal Summary Table */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">סיכום תזונה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.mealBreakdown || {}).map(([key, value]: any) => (
              <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">
                  {key === "regular" ? "רגיל" : key === "vegetarian" ? "צמחוני" : key === "vegan" ? "טבעוני" : "חסר גלוטן"}
                </span>
                <span className="text-lg font-bold text-accent">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Guests.tsx =====

```tsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Search } from "lucide-react";

const guestSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  phone: z.string().min(9, "טלפון נדרש"),
  group: z.enum(["bride", "groom", "mutual"]),
  role: z.enum(["regular", "vip", "bridesmaid", "groomsman"]),
});

type GuestFormData = z.infer<typeof guestSchema>;

const roleOptions = [
  { value: "regular", label: "רגיל" },
  { value: "vip", label: "VIP" },
  { value: "bridesmaid", label: "שושבין/ת הכלה" },
  { value: "groomsman", label: "שושבין/ת החתן" },
];

export default function Guests() {
  const { data: guests, isLoading, refetch } = trpc.guests.list.useQuery();
  const createGuest = trpc.guests.create.useMutation();
  const updateGuest = trpc.guests.update.useMutation();
  const deleteGuest = trpc.guests.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: "",
      phone: "",
      group: "mutual",
      role: "regular",
    },
  });

  const onSubmit = async (data: GuestFormData) => {
    try {
      if (editingId) {
        await updateGuest.mutateAsync({ id: editingId, ...data });
        toast.success("אורח עודכן בהצלחה");
      } else {
        await createGuest.mutateAsync(data);
        toast.success("אורח נוסף בהצלחה");
      }
      reset();
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "שגיאה בשמירת אורח");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("האם אתם בטוחים שברצונכם למחוק אורח זה?")) return;
    try {
      await deleteGuest.mutateAsync({ id });
      toast.success("אורח נמחק בהצלחה");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "שגיאה במחיקת אורח");
    }
  };

  const filteredGuests = (guests || []).filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || guest.group === filterGroup;
    const matchesRole = filterRole === "all" || guest.role === filterRole;
    return matchesSearch && matchesGroup && matchesRole;
  });

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-start">
        <div className="text-right">
          <h1 className="text-4xl font-bold text-foreground mb-2">מוזמנים</h1>
          <p className="text-muted-foreground">ניהול רשימת המוזמנים שלכם</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            reset();
          }}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסיפו אורח
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="card-shadow border-2 border-accent">
          <CardHeader>
            <CardTitle className="text-right">
              {editingId ? "ערכו אורח" : "הוסיפו אורח חדש"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-right block mb-2">
                  שם *
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="שם מלא"
                      className="text-right"
                      dir="rtl"
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-right block mb-2">
                  טלפון *
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="05xxxxxxxx"
                      className="text-right"
                      dir="rtl"
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-right block mb-2">
                  צד *
                </label>
                <Controller
                  name="group"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bride">צד הכלה</SelectItem>
                        <SelectItem value="groom">צד החתן</SelectItem>
                        <SelectItem value="mutual">משותף</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-right block mb-3">
                  סוג אורח *
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      {roleOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-right ${
                            field.value === option.value
                              ? "border-accent bg-accent/10 text-accent font-medium"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={createGuest.isPending || updateGuest.isPending}
                >
                  {editingId ? "עדכנו" : "הוסיפו"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    reset();
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-right block mb-2">
            חיפוש
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חפשו שם..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
              dir="rtl"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-right block mb-2">
            צד
          </label>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="bride">צד הכלה</SelectItem>
              <SelectItem value="groom">צד החתן</SelectItem>
              <SelectItem value="mutual">משותף</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-right block mb-2">
            סוג אורח
          </label>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Guests List */}
      <div className="space-y-2">
        {filteredGuests.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground">אין מוזמנים עדיין</p>
            </CardContent>
          </Card>
        ) : (
          filteredGuests.map((guest) => (
            <Card key={guest.id} className="card-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-right">
                      {guest.name}
                    </h3>
                    <p className="text-sm text-muted-foreground text-right">
                      {guest.phone}
                    </p>
                    <div className="flex gap-2 mt-2 justify-end">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {guest.group === "bride"
                          ? "צד הכלה"
                          : guest.group === "groom"
                          ? "צד החתן"
                          : "משותף"}
                      </span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {guest.role === "vip"
                          ? "VIP"
                          : guest.role === "bridesmaid"
                          ? "שושבין/ת הכלה"
                          : guest.role === "groomsman"
                          ? "שושבין/ת החתן"
                          : "אורח רגיל"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(guest.id);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(guest.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/GuestRSVP.tsx =====

```tsx
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import RSVPError from "./RSVPError";

const mealOptions = [
  { value: "regular", label: "רגיל" },
  { value: "vegetarian", label: "צמחוני" },
  { value: "vegan", label: "טבעוני" },
  { value: "glutenFree", label: "חסר גלוטן" },
];

interface GuestRSVPPageProps {
  token?: string;
}

export default function GuestRSVP({ token }: GuestRSVPPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: rsvpData, isLoading: dataLoading, isError } = trpc.rsvp.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const submitRsvp = trpc.rsvp.submit.useMutation();

  const rsvpSchema = z.object({
    attending: z.boolean(),
    plusOnesCount: z.number().min(0).max(5).default(0),
    mealPreference: z.enum(["regular", "vegetarian", "vegan", "glutenFree"]).default("regular"),
    plusOnesMeals: z.array(z.enum(["regular", "vegetarian", "vegan", "glutenFree"])).optional(),
  });

  type RsvpFormData = z.infer<typeof rsvpSchema>;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema) as any,
    defaultValues: {
      attending: true,
      plusOnesCount: 0,
      mealPreference: "regular",
      plusOnesMeals: [],
    },
  });

  const attending = watch("attending");
  const plusOnesCount = watch("plusOnesCount");

  useEffect(() => {
    if (!token) {
      setError("No RSVP token provided");
      setLoading(false);
      return;
    }

    if (isError) {
      setError("Token not found");
      setLoading(false);
      return;
    }

    if (rsvpData) {
      setLoading(false);
    }
  }, [rsvpData, token, isError, dataLoading]);

  const onSubmit = async (data: RsvpFormData) => {
    if (!token) {
      toast.error("RSVP token not found");
      return;
    }

    try {
      await submitRsvp.mutateAsync({
        token,
        attending: data.attending,
        plusOnesCount: data.plusOnesCount,
        mealPreference: data.mealPreference,
        plusOnesMeals: data.plusOnesMeals || [],
      });
      setSubmitted(true);
      toast.success("תודה! אישור ההגעה שלכם התקבל");
    } catch (error: any) {
      toast.error(error.message || "שגיאה בשליחת אישור ההגעה");
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !rsvpData || isError) {
    return <RSVPError />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md card-shadow">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">תודה רבה!</h2>
            <p className="text-muted-foreground mb-6">
              אישור ההגעה שלכם התקבל בהצלחה. אנחנו שמחים שתהיו איתנו בחתונה!
            </p>
            <p className="text-sm text-muted-foreground">
              אם יש שינויים, אנא צרו קשר ישירות
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const guest = rsvpData?.guest;

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <Card className="card-shadow">
          <CardHeader className="text-center border-b border-border pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">
              אישור הגעה
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              שלום {guest?.name} 👋
            </p>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Attendance */}
              <div>
                <label className="text-sm font-medium text-right block mb-4">
                  אתם מגיעים לחתונה?
                </label>
                <div className="space-y-2">
                  <Controller
                    name="attending"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`w-full p-4 rounded-lg border-2 transition-all font-medium text-lg ${
                            field.value
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-background text-foreground hover:border-accent/50"
                          }`}
                        >
                          ✓ כן, אני מגיע/ה
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`w-full p-4 rounded-lg border-2 transition-all font-medium text-lg ${
                            !field.value
                              ? "border-red-500 bg-red-50 text-red-600"
                              : "border-border bg-background text-foreground hover:border-red-300"
                          }`}
                        >
                          ✗ לא, לא מגיע/ה
                        </button>
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Plus Ones Count */}
              {attending && (
                <div>
                  <label className="text-sm font-medium text-right block mb-3">
                    כמה אנשים נוספים תביאו?
                  </label>
                  <Controller
                    name="plusOnesCount"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - רק אני</SelectItem>
                          <SelectItem value="1">1 - אני ועוד אחד</SelectItem>
                          <SelectItem value="2">2 - אני ועוד שניים</SelectItem>
                          <SelectItem value="3">3 - אני ועוד שלושה</SelectItem>
                          <SelectItem value="4">4 - אני ועוד ארבעה</SelectItem>
                          <SelectItem value="5">5 - אני ועוד חמישה</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {/* Meal Preferences */}
              {attending && (
                <div className="space-y-6 border-t border-border pt-6">
                  {/* Main Guest Meal */}
                  <div>
                    <label className="text-sm font-medium text-right block mb-3">
                      🍽️ תזונה שלך
                    </label>
                    <Controller
                      name="mealPreference"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mealOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Plus Ones Meals */}
                  {plusOnesCount > 0 && (
                    <div className="space-y-4">
                      {Array.from({ length: plusOnesCount }).map((_, index) => (
                        <div key={index}>
                          <label className="text-sm font-medium text-right block mb-3">
                            🍽️ תזונה מלווה {index + 1}
                          </label>
                          <Controller
                            name={`plusOnesMeals.${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value || "regular"}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="text-right">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {mealOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg font-medium"
                disabled={submitRsvp.isPending}
              >
                {submitRsvp.isPending ? "שולח..." : "שלחו אישור הגעה"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                אם יש שינויים, אתם יכולים לחזור לטופס זה בכל עת
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/RSVPSummary.tsx =====

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MEAL_COLORS = {
  regular: "#a4d4ae",
  vegetarian: "#f4a6a6",
  vegan: "#b8d4f1",
  glutenFree: "#f4d4a6",
};

export default function RSVPSummary() {
  const { data: rsvpData, isLoading } = trpc.rsvp.list.useQuery();

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  const stats = rsvpData || {
    totalInvited: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    totalAttending: 0,
    mealBreakdown: {},
  };

  const rsvpChartData = [
    { name: "אישרו הגעה", value: stats.confirmed, fill: "#a4d4ae" },
    { name: "לא מגיעים", value: stats.declined, fill: "#f4a6a6" },
    { name: "בהמתנה", value: stats.pending, fill: "#d4c4f1" },
  ];

  const mealChartData = Object.entries(stats.mealBreakdown || {}).map(([key, value]: any) => ({
    name: key === "regular" ? "רגיל" : key === "vegetarian" ? "צמחוני" : key === "vegan" ? "טבעוני" : "חסר גלוטן",
    value: value,
    fill: MEAL_COLORS[key as keyof typeof MEAL_COLORS] || "#a4d4ae",
  }));

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">אישורי הגעה</h1>
        <p className="text-muted-foreground">סקירת תגובות המוזמנים</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">סך מוזמנים</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalInvited}</p>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 border-green-600">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">אישרו הגעה</p>
            <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 border-red-600">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">לא מגיעים</p>
            <p className="text-3xl font-bold text-red-600">{stats.declined}</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">בהמתנה</p>
            <p className="text-3xl font-bold text-accent">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">מי מגיע?</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rsvpChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#a4d4ae" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">מה כולם אוכלים?</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mealChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mealChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Meal Summary */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">סיכום תזונה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.mealBreakdown || {}).map(([key, value]: any) => (
              <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">
                  {key === "regular" ? "רגיל" : key === "vegetarian" ? "צמחוני" : key === "vegan" ? "טבעוני" : "חסר גלוטן"}
                </span>
                <span className="text-lg font-bold text-accent">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Seating.tsx =====

```tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Table {
  id: string;
  x: number;
  y: number;
  shape: "round" | "rectangle";
  color: string;
  capacity: number;
  guests: string[];
}

const tableColors = [
  { value: "#a4d4ae", label: "ירוק עדין" },
  { value: "#f4a6a6", label: "ורוד עדין" },
  { value: "#b8d4f1", label: "כחול עדין" },
  { value: "#f4d4a6", label: "כתום עדין" },
  { value: "#d4c4f1", label: "סגול עדין" },
  { value: "#f1d4d4", label: "אדום עדין" },
];

export default function Seating() {
  const [tables, setTables] = useState<Table[]>([]);
  const [hallShape, setHallShape] = useState<"rectangle" | "square">("rectangle");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const addTable = () => {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      shape: "round",
      color: tableColors[Math.floor(Math.random() * tableColors.length)].value,
      capacity: 8,
      guests: [],
    };
    setTables([...tables, newTable]);
    toast.success("שולחן נוסף");
  };

  const deleteTable = (id: string) => {
    setTables(tables.filter((t) => t.id !== id));
    setSelectedTable(null);
    toast.success("שולחן נמחק");
  };

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables(tables.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingTable(tableId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;

    const canvas = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newX = e.clientX - canvas.left - dragOffset.x;
    const newY = e.clientY - canvas.top - dragOffset.y;

    updateTable(draggingTable, {
      x: Math.max(0, Math.min(newX, canvas.width - 80)),
      y: Math.max(0, Math.min(newY, canvas.height - 80)),
    });
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">סידורי ישיבה</h1>
        <p className="text-muted-foreground">סדרו את השולחנות בהולכי המלון שלכם</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-right block mb-2">
            צורת ההולכי
          </label>
          <Select value={hallShape} onValueChange={(val: any) => setHallShape(val)}>
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rectangle">מלבן</SelectItem>
              <SelectItem value="square">ריבוע</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-right block mb-2">
            סוג שולחן
          </label>
          <Select defaultValue="round">
            <SelectTrigger className="text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round">עגול</SelectItem>
              <SelectItem value="rectangle">מלבני</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={addTable}
          className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 mt-6"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסיפו שולחן
        </Button>
      </div>

      {/* Hall Layout */}
      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          <div
            className={`relative bg-gradient-to-br from-background to-muted ${
              hallShape === "rectangle" ? "h-96" : "h-80"
            } border-2 border-border`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="absolute top-4 right-4 text-xs text-muted-foreground font-medium">
              הולכי המלון
            </div>

            {tables.map((table) => (
              <div
                key={table.id}
                className={`absolute cursor-move transition-all ${
                  selectedTable === table.id ? "ring-2 ring-accent" : ""
                }`}
                style={{
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: "80px",
                  height: "80px",
                }}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                onClick={() => setSelectedTable(table.id)}
              >
                <div
                  className={`w-full h-full flex items-center justify-center font-bold text-white text-sm shadow-lg ${
                    table.shape === "round" ? "rounded-full" : "rounded-lg"
                  }`}
                  style={{ backgroundColor: table.color }}
                >
                  {table.guests.length}/{table.capacity}
                </div>
              </div>
            ))}

            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">אין שולחנות עדיין</p>
                  <p className="text-sm">לחצו על "הוסיפו שולחן" כדי להתחיל</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Table Controls */}
      {selectedTable && (
        <Card className="card-shadow border-2 border-accent">
          <CardHeader>
            <CardTitle className="text-right">עריכת שולחן</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-right block mb-2">
                צבע
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tableColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      updateTable(selectedTable, { color: color.value })
                    }
                    className="p-3 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: color.value,
                      borderColor:
                        tables.find((t) => t.id === selectedTable)?.color ===
                        color.value
                          ? "#000"
                          : "transparent",
                    }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-right block mb-2">
                קיבולת
              </label>
              <Select
                value={String(
                  tables.find((t) => t.id === selectedTable)?.capacity || 8
                )}
                onValueChange={(val) =>
                  updateTable(selectedTable, { capacity: Number(val) })
                }
              >
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 אנשים</SelectItem>
                  <SelectItem value="6">6 אנשים</SelectItem>
                  <SelectItem value="8">8 אנשים</SelectItem>
                  <SelectItem value="10">10 אנשים</SelectItem>
                  <SelectItem value="12">12 אנשים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="destructive"
              onClick={() => deleteTable(selectedTable)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחקו שולחן
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tables List */}
      {tables.length > 0 && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">רשימת שולחנות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tables.map((table, idx) => (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTable === table.id
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div
                        className={`w-6 h-6 ${
                          table.shape === "round" ? "rounded-full" : "rounded"
                        }`}
                        style={{ backgroundColor: table.color }}
                      />
                      <span className="font-medium text-foreground">
                        שולחן {idx + 1}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {table.guests.length}/{table.capacity} אנשים
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="bg-accent/10 border border-accent rounded-lg p-4 text-right">
        <p className="text-sm text-foreground font-medium mb-2">💡 טיפים:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• גררו שולחנות כדי להעביר אותם בהולכי</li>
          <li>• לחצו על שולחן כדי לערוך את הפרטים שלו</li>
          <li>• בחרו צבעים שונים כדי להבדיל בין קבוצות</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Invitations.tsx =====

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Invitations() {
  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">הזמנות</h1>
        <p className="text-muted-foreground">ניהול הזמנות דיגיטליות</p>
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">תכונה זו תהיה זמינה בקרוב</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Budget.tsx =====

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Budget() {
  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">תקציב</h1>
        <p className="text-muted-foreground">ניהול הוצאות החתונה</p>
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">תכונה זו תהיה זמינה בקרוב</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Timeline.tsx =====

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Timeline() {
  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">לוח זמנים</h1>
        <p className="text-muted-foreground">תכנון לוח הזמנים ליום החתונה</p>
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">תכונה זו תהיה זמינה בקרוב</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/Gallery.tsx =====

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Gallery() {
  return (
    <div className="space-y-8" dir="rtl">
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">גלריה</h1>
        <p className="text-muted-foreground">ניהול תמונות החתונה</p>
      </div>

      <Card className="card-shadow">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">תכונה זו תהיה זמינה בקרוב</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/RSVPError.tsx =====

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function RSVPError() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md card-shadow">
        <CardContent className="pt-12 pb-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">לא נמצאה הזמנה</h2>
          <p className="text-muted-foreground">
            הקישור שלכם אינו תקף או שתוקף הזמנה פג
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            אנא צרו קשר עם זוג הנשואין לקבלת קישור חדש
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ===== FILE: client/src/pages/NotFound.tsx =====

```tsx
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">הדף לא נמצא</p>
        <Button
          onClick={() => navigate("/")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          חזרו לעמוד הבית
        </Button>
      </div>
    </div>
  );
}
```

---

## ===== FILE: client/src/components/WeddingLayout.tsx =====

```tsx
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Users,
  Mail,
  CheckCircle,
  Armchair,
  DollarSign,
  Clock,
  Image,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "דשבורד", icon: BarChart3 },
  { href: "/guests", label: "מוזמנים", icon: Users },
  { href: "/invitations", label: "הזמנות", icon: Mail },
  { href: "/rsvp", label: "אישורי הגעה", icon: CheckCircle },
  { href: "/seating", label: "סידורי ישיבה", icon: Armchair },
  { href: "/budget", label: "תקציב", icon: DollarSign },
  { href: "/timeline", label: "לוח זמנים", icon: Clock },
  { href: "/gallery", label: "גלריה", icon: Image },
];

export default function WeddingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      navigate("/");
      toast.success("התנתקתם בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהתנתקות");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-row-reverse" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border shadow-lg hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground text-right">💍 חתונה</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-accent/10 transition-colors text-foreground hover:text-accent"
              >
                <span className="text-right flex-1">{item.label}</span>
                <Icon className="w-4 h-4 flex-shrink-0" />
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-end gap-2"
            disabled={logout.isPending}
          >
            <LogOut className="w-4 h-4" />
            התנתקות
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-0 right-0 left-0 bg-card border-b border-border p-4 flex justify-between items-center z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-accent/10 rounded-lg"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <h1 className="text-xl font-bold">💍 חתונה</h1>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 right-0 left-0 bg-card border-b border-border p-4 space-y-2 z-40">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => {
                  navigate(item.href);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right hover:bg-accent/10 transition-colors"
