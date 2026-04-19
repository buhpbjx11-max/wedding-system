import React, { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Users, CheckCircle, Clock, UserPlus, Mail, Armchair, MapPin, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLocation } from "wouter";

function useDaysUntil(dateStr?: string | null) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: wedding } = trpc.wedding.get.useQuery();
  const { data: guests, isLoading: guestsLoading } = trpc.guests.list.useQuery();
  const { data: rsvpData, isLoading: rsvpLoading } = trpc.rsvp.summary.useQuery();
  const daysLeft = useDaysUntil(wedding?.weddingDate);

  const stats = useMemo(() => {
    if (!guests || !rsvpData) {
      return { totalGuests: 0, confirmed: 0, declined: 0, pending: 0, totalAttending: 0, confirmationRate: 0 };
    }
    const confirmationRate =
      guests.length > 0 ? Math.round(((rsvpData.confirmed + rsvpData.declined) / guests.length) * 100) : 0;
    return {
      totalGuests: guests.length,
      confirmed: rsvpData.confirmed,
      declined: rsvpData.declined,
      pending: rsvpData.pending,
      totalAttending: rsvpData.totalAttending,
      confirmationRate,
    };
  }, [guests, rsvpData]);

  if (guestsLoading || rsvpLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const chartData = [
    { name: "אישרו", value: stats.confirmed, fill: "#22c55e" },
    { name: "לא מגיעים", value: stats.declined, fill: "#ef4444" },
    { name: "בהמתנה", value: stats.pending, fill: "#94a3b8" },
  ];

  const weddingDateFormatted = wedding?.weddingDate
    ? new Date(wedding.weddingDate).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Couple Hero */}
      <Card className="border-accent/40 bg-gradient-to-l from-accent/5 to-background">
        <CardContent className="py-6 px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 flex-row-reverse">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Heart className="w-5 h-5 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">
                  {wedding?.brideNames} &amp; {wedding?.groomNames}
                </h1>
              </div>
              {weddingDateFormatted && (
                <div className="flex items-center gap-1.5 justify-end text-muted-foreground text-sm mt-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>{weddingDateFormatted}</span>
                </div>
              )}
              {wedding?.venue && (
                <div className="flex items-center gap-1.5 justify-end text-muted-foreground text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{wedding.venue}</span>
                </div>
              )}
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <div className="text-center bg-accent/10 border border-accent/30 rounded-2xl px-6 py-4 min-w-[100px]">
                <div className="text-4xl font-bold text-accent">{daysLeft}</div>
                <div className="text-xs text-muted-foreground mt-1">ימים לחתונה</div>
              </div>
            )}
            {daysLeft !== null && daysLeft < 0 && (
              <div className="text-center bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
                <div className="text-2xl font-bold text-green-600">🎉</div>
                <div className="text-xs text-muted-foreground mt-1">מזל טוב!</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="text-right">
        <h2 className="text-xl font-bold text-foreground">סקירת מצב</h2>
      </div>

      {/* Quick Actions */}
      <Card className="border-accent/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-right text-base flex items-center justify-end gap-2">
            <Heart className="w-4 h-4 text-accent" />
            פעולות מהירות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              onClick={() => navigate("/guests")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <UserPlus className="w-4 h-4 ml-2" />
              הוסיפו אורח
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/invitations")}
            >
              <Mail className="w-4 h-4 ml-2" />
              שלחו הזמנות
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/seating")}
            >
              <Armchair className="w-4 h-4 ml-2" />
              סידורי ישיבה
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-end gap-1.5">
              <Users className="w-3.5 h-3.5" />
              סך מוזמנים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold">{stats.totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-end gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              אישרו הגעה
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{stats.confirmationRate}% הגיבו</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-accent flex items-center justify-end gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              סך מגיעים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-accent">{stats.totalAttending}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              כולל {Math.max(0, stats.totalAttending - stats.confirmed)} מלווים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              בהמתנה
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-muted-foreground">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {stats.totalGuests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-base">מי מגיע?</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {stats.totalGuests === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-4">עדיין אין מוזמנים</p>
            <Button onClick={() => navigate("/guests")} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <UserPlus className="w-4 h-4 ml-2" />
              הוסיפו מוזמן ראשון
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
