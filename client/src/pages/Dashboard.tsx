import React, { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { data: guests, isLoading: guestsLoading } = trpc.guests.list.useQuery();
  const { data: rsvpResponses, isLoading: rsvpLoading } = trpc.rsvp.summary.useQuery();

  const stats = useMemo(() => {
    if (!guests || !rsvpResponses) {
      return {
        totalGuests: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        totalAttending: 0,
        confirmationRate: 0,
      };
    }

    const confirmed = rsvpResponses.confirmed || 0;
    const declined = rsvpResponses.declined || 0;
    const pending = rsvpResponses.pending || 0;
    const totalAttending = rsvpResponses.totalAttending || 0;

    const confirmationRate =
      guests.length > 0 ? Math.round(((confirmed + declined) / guests.length) * 100) : 0;

    return {
      totalGuests: guests.length,
      confirmed,
      declined,
      pending,
      totalAttending,
      confirmationRate,
    };
  }, [guests, rsvpResponses]);

  const budgetStats = useMemo(() => {
    return { totalBudget: 0, totalSpent: 0, remaining: 0 };
  }, []);

  const mealPreferenceData = useMemo(() => {
    if (!rsvpResponses) return [];

    return [
      { name: "רגיל", value: rsvpResponses.meals?.regular || 0, color: "#a4d4ae" },
      { name: "צמחוני", value: rsvpResponses.meals?.vegetarian || 0, color: "#f4a6a6" },
      { name: "טבעוני", value: rsvpResponses.meals?.vegan || 0, color: "#b8d4f1" },
      { name: "ללא גלוטן", value: rsvpResponses.meals?.glutenFree || 0, color: "#f4d4a6" },
    ].filter((item) => item.value > 0);
  }, [rsvpResponses]);

  if (guestsLoading || rsvpLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground mb-2">דשבורד</h1>
        <p className="text-muted-foreground">סקירת החתונה שלכם</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <Users className="w-4 h-4" />
              סך מוזמנים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-foreground">{stats.totalGuests}</div>
            <p className="text-xs text-muted-foreground mt-1">מוזמנים</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <CheckCircle className="w-4 h-4" />
              אישרו הגעה
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.confirmationRate}% הגיבו
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 border-accent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-accent flex items-center justify-end gap-2">
              <Heart className="w-4 h-4" />
              סך מגיעים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-accent">{stats.totalAttending}</div>
            <p className="text-xs text-muted-foreground mt-1">כולל {stats.totalAttending - stats.confirmed} מלווים</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <Clock className="w-4 h-4" />
              בהמתנה
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-muted-foreground">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">ממתינים לתגובה</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSVP Status */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">מי מגיע?</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: "אישרו", value: stats.confirmed },
                  { name: "לא מגיעים", value: stats.declined },
                  { name: "בהמתנה", value: stats.pending },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Meal Preferences */}
        {mealPreferenceData.length > 0 && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-right">מה כולם אוכלים?</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealPreferenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mealPreferenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Overview */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-end gap-2 flex-row-reverse">
            <Heart className="w-5 h-5 text-accent" />
            התקציב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            <div>
              <p className="text-sm text-muted-foreground mb-1">תקציב כולל</p>
              <p className="text-2xl font-bold text-foreground">
                ₪{budgetStats.totalBudget.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">הוצאות עד כה</p>
              <p className="text-2xl font-bold text-accent">
                ₪{budgetStats.totalSpent.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">עדיין זמין</p>
              <p
                className={`text-2xl font-bold ${
                  budgetStats.remaining >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₪{budgetStats.remaining.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  (budgetStats.totalSpent / budgetStats.totalBudget) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {Math.round((budgetStats.totalSpent / budgetStats.totalBudget) * 100)}% מהתקציב בשימוש
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
