import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  { label: "ורוד עדין", value: "#e8a4b8" },
  { label: "ירוק מרווה", value: "#a4d4ae" },
  { label: "כחול עדין", value: "#b8d4f1" },
  { label: "זהב", value: "#d4a84b" },
  { label: "לבנדר", value: "#c4b4e0" },
  { label: "שחור קלאסי", value: "#2d2d2d" },
];

export default function Settings() {
  const utils = trpc.useUtils();
  const { data: wedding, isLoading } = trpc.wedding.get.useQuery();
  const updateWedding = trpc.wedding.update.useMutation({
    onSuccess: () => utils.wedding.get.invalidate(),
  });

  const [brideNames, setBrideNames] = useState("");
  const [groomNames, setGroomNames] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");
  const [accentColor, setAccentColor] = useState("#e8a4b8");
  const [websiteLink, setWebsiteLink] = useState("");

  useEffect(() => {
    if (!wedding) return;
    setBrideNames(wedding.brideNames ?? "");
    setGroomNames(wedding.groomNames ?? "");
    if (wedding.weddingDate) {
      const d = new Date(wedding.weddingDate);
      setWeddingDate(d.toISOString().split("T")[0]);
    }
    setVenue(wedding.venue ?? "");
    if (wedding.theme) {
      try {
        const t = JSON.parse(wedding.theme);
        if (t.accentColor) setAccentColor(t.accentColor);
        if (t.websiteLink) setWebsiteLink(t.websiteLink);
      } catch {}
    }
  }, [wedding]);

  const handleSave = async () => {
    const theme = JSON.stringify({ accentColor, websiteLink });
    try {
      await updateWedding.mutateAsync({
        brideNames: brideNames || undefined,
        groomNames: groomNames || undefined,
        weddingDate: weddingDate || undefined,
        venue: venue || undefined,
        theme,
      });
      toast.success("הגדרות נשמרו בהצלחה");

      // Apply accent color as CSS variable
      document.documentElement.style.setProperty(
        "--accent",
        hexToHsl(accentColor)
      );
    } catch {
      toast.error("שגיאה בשמירת הגדרות");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">הגדרות</h1>
        <p className="text-muted-foreground mt-0.5">פרטי האירוע ועיצוב המערכת</p>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-base flex items-center justify-end gap-2">
            <Settings2 className="w-4 h-4" />
            פרטי האירוע
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5 text-right">שם הכלה</label>
              <Input
                value={brideNames}
                onChange={e => setBrideNames(e.target.value)}
                placeholder="שם הכלה"
                className="text-right"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5 text-right">שם החתן</label>
              <Input
                value={groomNames}
                onChange={e => setGroomNames(e.target.value)}
                placeholder="שם החתן"
                className="text-right"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-right">תאריך החתונה</label>
            <Input
              type="date"
              value={weddingDate}
              onChange={e => setWeddingDate(e.target.value)}
              className="text-right"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-right">מיקום / אולם</label>
            <Input
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="שם האולם, כתובת..."
              className="text-right"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5 text-right">קישור לאתר האורחים</label>
            <Input
              value={websiteLink}
              onChange={e => setWebsiteLink(e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-base">צבע עיצוב</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setAccentColor(c.value)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                  accentColor === c.value ? "border-foreground" : "border-transparent hover:border-muted-foreground"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-sm"
                  style={{ backgroundColor: c.value }}
                />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 flex-row-reverse">
            <label className="text-sm font-medium text-right">צבע מותאם אישית:</label>
            <input
              type="color"
              value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="h-9 w-16 rounded cursor-pointer border border-border"
            />
            <div
              className="w-6 h-6 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button
          onClick={handleSave}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={updateWedding.isPending}
        >
          {updateWedding.isPending ? (
            <><Loader2 className="w-4 h-4 ml-2 animate-spin" />שומר...</>
          ) : (
            <><Save className="w-4 h-4 ml-2" />שמור הגדרות</>
          )}
        </Button>
      </div>
    </div>
  );
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
