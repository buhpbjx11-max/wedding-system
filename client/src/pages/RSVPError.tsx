import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useLocation } from "wouter";

export default function RSVPError() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4" dir="rtl">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      {/* Error Content */}
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-red-100 p-6 rounded-full">
            <Heart className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            לא נמצאה הזמנה
          </h1>
          <p className="text-lg text-muted-foreground">
            הקישור שלכם אינו תקף או שפג תוקפו.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-accent/5 p-6 rounded-lg border border-accent/20 space-y-3 text-right">
          <p className="font-semibold text-foreground">מה עכשיו?</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• בדקו שהקישור שלכם נכון</li>
            <li>• בקשו קישור חדש מהזוג</li>
            <li>• צרו קשר עם הזוג ישירות</li>
          </ul>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/")}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 text-base font-semibold rounded-lg h-auto"
        >
          חזרו לעמוד הבית
        </Button>
      </div>
    </div>
  );
}
