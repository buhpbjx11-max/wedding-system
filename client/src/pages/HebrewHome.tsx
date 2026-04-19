import { Button } from "@/components/ui/button";
import { Heart, Users, CheckSquare, Armchair } from "lucide-react";
import { getLoginUrl, isOauthConfigured } from "@/const";

export default function HebrewHome() {
  const oauthEnabled = isOauthConfigured();
  const loginUrl = getLoginUrl();

  const handleLogin = () => {
    if (oauthEnabled && loginUrl) {
      window.location.href = loginUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-accent/10 p-4 rounded-full">
            <Heart className="w-12 h-12 text-accent" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            מתכננים חתונה?
          </h1>
          <p className="text-2xl md:text-3xl text-accent font-semibold">
            הכל במקום אחד.
          </p>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          ניהול מוזמנים, אישורי הגעה, סידורי ישיבה והזמנות — בקלות ובפשטות.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Users, title: "ניהול מוזמנים", desc: "ארגנו את כל המוזמנים לפי צד ותפקיד" },
            { icon: CheckSquare, title: "אישורי הגעה", desc: "קישור אישי לכל אורח, עדכון אוטומטי" },
            { icon: Armchair, title: "סידורי ישיבה", desc: "הקצאת מושבים לפי כמות ואורחים" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 bg-card rounded-xl border border-border text-right">
              <Icon className="w-7 h-7 text-accent mb-3 mr-auto ml-0" />
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-4">
          {oauthEnabled ? (
            <Button
              onClick={handleLogin}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-10 py-6 text-lg font-semibold rounded-xl h-auto"
            >
              כניסה למערכת
            </Button>
          ) : (
            <div className="p-4 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground">
              המערכת פועלת במצב פיתוח מקומי — אין צורך בהתחברות
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
