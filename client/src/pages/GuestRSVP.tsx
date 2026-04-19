import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Heart, MapPin, Calendar } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import RSVPError from "./RSVPError";

const mealOptions = [
  { value: "regular", label: "רגיל" },
  { value: "vegetarian", label: "צמחוני" },
  { value: "vegan", label: "טבעוני" },
  { value: "glutenFree", label: "ללא גלוטן" },
];

const rsvpSchema = z.object({
  attending: z.boolean(),
  plusOnesCount: z.number().min(0).max(10).default(0),
  mealPreference: z.enum(["regular", "vegetarian", "vegan", "glutenFree"]).default("regular"),
  plusOnesMeals: z.array(z.enum(["regular", "vegetarian", "vegan", "glutenFree"])).default([]),
  notes: z.string().optional(),
});
type RsvpForm = z.infer<typeof rsvpSchema>;

export default function GuestRSVP({ token }: { token?: string }) {
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError } = trpc.rsvp.getByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );
  const submitRsvp = trpc.rsvp.submit.useMutation();

  const { control, handleSubmit, watch, setValue } = useForm<RsvpForm>({
    resolver: zodResolver(rsvpSchema) as any,
    defaultValues: { attending: true, plusOnesCount: 0, mealPreference: "regular", plusOnesMeals: [], notes: "" },
  });

  const attending = watch("attending");
  const plusOnesCount = watch("plusOnesCount");

  useEffect(() => {
    setValue("plusOnesMeals", Array(plusOnesCount).fill("regular"));
  }, [plusOnesCount, setValue]);

  if (!token) return <RSVPError />;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (isError || !data) return <RSVPError />;

  const { guest, event } = data;

  const onSubmit = async (form: RsvpForm) => {
    try {
      await submitRsvp.mutateAsync({ token: token!, ...form });
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e?.message || "שגיאה בשליחת אישור הגעה");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-sm shadow-lg">
          <CardContent className="pt-10 pb-10 text-center">
            <CheckCircle className="w-14 h-14 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">תודה רבה! 💕</h2>
            <p className="text-muted-foreground text-sm">אישור ההגעה שלכם התקבל בהצלחה</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coupleNames = [event?.brideNames, event?.groomNames].filter(Boolean).join(" & ");
  const eventDate = event?.weddingDate ? new Date(event.weddingDate).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg overflow-hidden">
          {/* Header */}
          <CardHeader className="text-center bg-accent/10 py-8 border-b border-border">
            <Heart className="w-8 h-8 text-accent mx-auto mb-3" />
            {coupleNames && <h1 className="text-2xl font-bold text-foreground">{coupleNames}</h1>}
            <h2 className="text-lg font-semibold text-foreground mt-1">אישור הגעה לחתונה</h2>
            {(eventDate || event?.venue) && (
              <div className="mt-4 space-y-1.5">
                {eventDate && (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{eventDate}</span>
                  </div>
                )}
                {event?.venue && (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{event.venue}</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-base font-medium mt-4">
              שלום {guest.name}! 👋
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Attendance */}
              <div>
                <label className="text-sm font-medium block mb-3 text-right">האם תגיעו לחתונה?</label>
                <Controller
                  name="attending"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => field.onChange(true)}
                        className={`p-4 rounded-xl border-2 font-semibold text-base transition-all ${
                          field.value ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/40"
                        }`}>
                        ✓ כן, מגיע/ה
                      </button>
                      <button type="button" onClick={() => field.onChange(false)}
                        className={`p-4 rounded-xl border-2 font-semibold text-base transition-all ${
                          !field.value ? "border-red-400 bg-red-50 text-red-600" : "border-border hover:border-red-200"
                        }`}>
                        ✗ לא מגיע/ה
                      </button>
                    </div>
                  )}
                />
              </div>

              {attending && (
                <>
                  {/* Plus Ones */}
                  <div>
                    <label className="text-sm font-medium block mb-2 text-right">כמה אנשים נוספים מגיעים איתכם?</label>
                    <Controller
                      name="plusOnesCount"
                      control={control}
                      render={({ field }) => (
                        <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                              <SelectItem key={n} value={String(n)}>
                                {n === 0 ? "רק אני" : `אני + ${n} נוספים`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Meals */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium block text-right">🍽 העדפת תזונה שלך</label>
                    <Controller
                      name="mealPreference"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-right"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {mealOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />

                    {plusOnesCount > 0 && (
                      <div className="space-y-2 border-t border-border pt-3">
                        {Array.from({ length: plusOnesCount }, (_, i) => (
                          <div key={i}>
                            <label className="text-xs text-muted-foreground block mb-1 text-right">מלווה {i + 1}</label>
                            <Controller
                              name={`plusOnesMeals.${i}`}
                              control={control}
                              render={({ field }) => (
                                <Select value={field.value ?? "regular"} onValueChange={field.onChange}>
                                  <SelectTrigger className="text-right h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {mealOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium block mb-2 text-right">הערות נוספות (אופציונלי)</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="אלרגיות, בקשות מיוחדות, ברכה..."
                      rows={3}
                      className="text-right resize-none"
                    />
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-5 text-base font-semibold"
                disabled={submitRsvp.isPending}
              >
                {submitRsvp.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />שולח...</> : "שלחו אישור הגעה"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                ניתן לחזור לטופס זה ולעדכן בכל עת
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
