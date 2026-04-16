import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function RSVPSummary() {
  const { data: rsvpData, isLoading } = trpc.rsvp.summary.useQuery();

  const stats = useMemo(() => {
    if (!rsvpData) {
      return {
        totalInvited: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        totalAttending: 0,
        confirmationRate: 0,
      };
    }

    const confirmationRate = rsvpData.totalInvited > 0 ? Math.round(((rsvpData.confirmed + rsvpData.declined) / rsvpData.totalInvited) * 100) : 0;

    return {
      totalInvited: rsvpData.totalInvited,
      confirmed: rsvpData.confirmed,
      declined: rsvpData.declined,
      pending: rsvpData.pending,
      totalAttending: rsvpData.totalAttending,
      confirmationRate,
    };
  }, [rsvpData]);

  const mealBreakdown = useMemo(() => {
    if (!rsvpData) return [];

    return [
      { name: "רגיל", value: rsvpData.meals.regular, color: "#a4d4ae" },
      { name: "צמחוני", value: rsvpData.meals.vegetarian, color: "#f4a6a6" },
      { name: "טבעוני", value: rsvpData.meals.vegan, color: "#b8d4f1" },
      { name: "ללא גלוטן", value: rsvpData.meals.glutenFree, color: "#f4d4a6" },
    ].filter((item) => item.value > 0);
  }, [rsvpData]);

  if (isLoading) {
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
        <h1 className="text-4xl font-bold text-foreground mb-2">אישורי הגעה</h1>
        <p className="text-muted-foreground">
          עקבו אחרי תגובות המוזמנים שלכם והעדפות האכל
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <Users className="w-4 h-4" />
              סך מוזמנים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-foreground">
              {stats.totalInvited}
            </div>
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
            <div className="text-3xl font-bold text-green-600">
              {stats.confirmed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.confirmationRate}% הגיבו
            </p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-2">
              <XCircle className="w-4 h-4" />
              לא מגיעים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-red-600">{stats.declined}</div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 border-accent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-accent flex items-center justify-end gap-2">
              <Clock className="w-4 h-4" />
              סך מגיעים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-accent">
              {stats.totalAttending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              כולל {stats.totalAttending - stats.confirmed} מלווים
            </p>
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

        {/* Meal Preferences Chart */}
        {mealBreakdown.length > 0 && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-right">מה כולם אוכלים?</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mealBreakdown.map((entry, index) => (
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

      {/* Meal Summary Table */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">סיכום העדפות אכל</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mealBreakdown.map((meal) => (
              <div key={meal.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: meal.color }}
                  />
                  <span className="font-medium text-foreground">{meal.name}</span>
                </div>
                <span className="text-lg font-bold text-accent">{meal.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
