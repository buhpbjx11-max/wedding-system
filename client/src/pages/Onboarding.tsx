import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Calendar, MapPin, User } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const utils = trpc.useUtils();
  const updateWedding = trpc.wedding.update.useMutation({
    onSuccess: () => utils.wedding.get.invalidate(),
  });

  const [step, setStep] = useState(1);
  const [brideNames, setBrideNames] = useState("");
  const [groomNames, setGroomNames] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");

  const handleFinish = async () => {
    if (!brideNames.trim() || !groomNames.trim()) {
      toast.error("יש למלא שם כלה ושם חתן");
      return;
    }
    try {
      await updateWedding.mutateAsync({
        brideNames: brideNames.trim(),
        groomNames: groomNames.trim(),
        weddingDate: weddingDate || undefined,
        venue: venue.trim() || undefined,
      });
    } catch {
      toast.error("שגיאה בשמירה, נסו שוב");
    }
  };

  const canNext1 = brideNames.trim().length > 0 && groomNames.trim().length > 0;
  const canFinish = canNext1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-accent/10 p-4 rounded-full mb-4">
            <Heart className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ברוכים הבאים!</h1>
          <p className="text-muted-foreground mt-2">כמה פרטים קטנים ונתחיל</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-accent" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Step 1 — Names */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-right flex items-center justify-end gap-2">
                <User className="w-4 h-4 text-accent" />
                שם הכלה *
              </label>
              <Input
                value={brideNames}
                onChange={e => setBrideNames(e.target.value)}
                placeholder="למשל: יעל"
                className="text-right text-lg"
                autoFocus
                onKeyDown={e => e.key === "Enter" && canNext1 && setStep(2)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right flex items-center justify-end gap-2">
                <User className="w-4 h-4 text-accent" />
                שם החתן *
              </label>
              <Input
                value={groomNames}
                onChange={e => setGroomNames(e.target.value)}
                placeholder="למשל: דן"
                className="text-right text-lg"
                onKeyDown={e => e.key === "Enter" && canNext1 && setStep(2)}
              />
            </div>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-5 text-base mt-2"
              disabled={!canNext1}
              onClick={() => setStep(2)}
            >
              המשך
            </Button>
          </div>
        )}

        {/* Step 2 — Date & Venue */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-right flex items-center justify-end gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                תאריך החתונה
              </label>
              <Input
                type="date"
                value={weddingDate}
                onChange={e => setWeddingDate(e.target.value)}
                className="text-right"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">ניתן להוסיף מאוחר יותר בהגדרות</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right flex items-center justify-end gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                שם האולם / מיקום
              </label>
              <Input
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="למשל: אולם השרון, תל אביב"
                className="text-right text-base"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                חזרה
              </Button>
              <Button
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground py-5 text-base"
                onClick={handleFinish}
                disabled={updateWedding.isPending || !canFinish}
              >
                {updateWedding.isPending ? "שומר..." : "בואו נתחיל! 🎉"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
