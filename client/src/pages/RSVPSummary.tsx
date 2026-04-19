import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, CheckCircle, XCircle, Clock, Globe, Copy, Check, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

export default function RSVPSummary() {
  const { data: rsvpData, isLoading } = trpc.rsvp.summary.useQuery();
  const { data: wedding } = trpc.wedding.get.useQuery();
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    if (!rsvpData) return { totalInvited: 0, confirmed: 0, declined: 0, pending: 0, totalAttending: 0, confirmationRate: 0 };
    const confirmationRate = rsvpData.totalInvited > 0
      ? Math.round(((rsvpData.confirmed + rsvpData.declined) / rsvpData.totalInvited) * 100)
      : 0;
    return { ...rsvpData, confirmationRate };
  }, [rsvpData]);

  const mealBreakdown = useMemo(() => {
    if (!rsvpData) return [];
    return [
      { name: "רגיל", value: rsvpData.meals.regular, color: "#a4d4ae" },
      { name: "צמחוני", value: rsvpData.meals.vegetarian, color: "#f4a6a6" },
      { name: "טבעוני", value: rsvpData.meals.vegan, color: "#b8d4f1" },
      { name: "ללא גלוטן", value: rsvpData.meals.glutenFree, color: "#f4d4a6" },
    ].filter(i => i.value > 0);
  }, [rsvpData]);

  // Website link from settings or dynamic
  const websiteLink = (() => {
    if (wedding?.theme) {
      try { const t = JSON.parse(wedding.theme); if (t.websiteLink) return t.websiteLink; } catch {}
    }
    return `${window.location.origin}/guest-rsvp/demo-token-12345`;
  })();

  const copyLink = () => {
    navigator.clipboard.writeText(websiteLink);
    setCopied(true);
    toast.success("קישור הועתק");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">אתר האורחים</h1>
        <p className="text-muted-foreground mt-0.5">ניהול דף האורחים ומעקב אישורי הגעה</p>
      </div>

      {/* Guest Website Link */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-right text-base flex items-center justify-end gap-2">
            <Globe className="w-4 h-4 text-accent" />
            הקישור לאתר האורחים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono truncate" dir="ltr">
              {websiteLink}
            </div>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <a href={websiteLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            שתפו קישור זה עם האורחים לאישור הגעה. כל אורח צריך את הקישור האישי שלו (ניתן ליצור בדף המוזמנים).
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-end gap-1.5">
              <Users className="w-3.5 h-3.5" />סך מוזמנים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold">{stats.totalInvited}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-end gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />אישרו
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">{stats.confirmationRate}% הגיבו</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-end gap-1.5">
              <XCircle className="w-3.5 h-3.5" />לא מגיעים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-red-500">{stats.declined}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-accent flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5" />סך מגיעים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-3xl font-bold text-accent">{stats.totalAttending}</div>
            <p className="text-xs text-muted-foreground">
              כולל {Math.max(0, stats.totalAttending - stats.confirmed)} מלווים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.totalInvited > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-base">מי מגיע?</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { name: "אישרו", value: stats.confirmed },
                  { name: "לא מגיעים", value: stats.declined },
                  { name: "בהמתנה", value: stats.pending },
                ]} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--accent)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {mealBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right text-base">העדפות אכל</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={mealBreakdown} cx="50%" cy="50%" outerRadius={80}
                      labelLine={false} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                      {mealBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-2">
                  {mealBreakdown.map(m => (
                    <div key={m.name} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className="font-bold text-accent">{m.value}</span>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-sm font-medium">{m.name}</span>
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
