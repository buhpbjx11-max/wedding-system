import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function HebrewHome() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      {/* Main Content */}
      <div className="max-w-2xl w-full text-center space-y-12">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-accent/10 p-4 rounded-full">
            <Heart className="w-12 h-12 text-accent" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            מתכננים חתונה?
          </h1>
          <p className="text-2xl md:text-3xl text-accent font-semibold">
            הכל במקום אחד.
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
          ניהול מוזמנים, אישורי הגעה, סידורי ישיבה והזמנות – בקלות ובפשטות.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-foreground mb-2">ניהול מוזמנים</h3>
            <p className="text-sm text-muted-foreground">
              ניהול קל של כל המוזמנים שלכם
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-3">✓</div>
            <h3 className="font-semibold text-foreground mb-2">אישורי הגעה</h3>
            <p className="text-sm text-muted-foreground">
              עקבו אחרי מי שאישר הגעה
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <div className="text-3xl mb-3">🍽️</div>
            <h3 className="font-semibold text-foreground mb-2">סידורי ישיבה</h3>
            <p className="text-sm text-muted-foreground">
              ארגנו את הישיבה בקלות
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            onClick={() => navigate("/guest-rsvp/demo-token-12345")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-semibold rounded-lg h-auto"
          >
            התחילו עכשיו
          </Button>
          <a href={getLoginUrl()}>
            <Button
              variant="outline"
              className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-lg h-auto border-2 border-accent text-accent hover:bg-accent/5"
            >
              כניסה למערכת
            </Button>
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground pt-8">
          אין צורך בהרשמה. פשוט התחילו!
        </p>
      </div>
    </div>
  );
}
