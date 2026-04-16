import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import RSVPError from "./RSVPError";

const mealOptions = [
  { value: "regular", label: "רגיל" },
  { value: "vegetarian", label: "צמחוני" },
  { value: "vegan", label: "טבעוני" },
  { value: "glutenFree", label: "חסר גלוטן" },
];

interface GuestRSVPPageProps {
  token?: string;
}

export default function GuestRSVP({ token }: GuestRSVPPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: rsvpData, isLoading: dataLoading, isError } = trpc.rsvp.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const submitRsvp = trpc.rsvp.submit.useMutation();

  const rsvpSchema = z.object({
    attending: z.boolean(),
    plusOnesCount: z.number().min(0).max(5).default(0),
    mealPreference: z.enum(["regular", "vegetarian", "vegan", "glutenFree"]).default("regular"),
    plusOnesMeals: z.array(z.enum(["regular", "vegetarian", "vegan", "glutenFree"])).optional(),
  });

  type RsvpFormData = z.infer<typeof rsvpSchema>;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema) as any,
    defaultValues: {
      attending: true,
      plusOnesCount: 0,
      mealPreference: "regular",
      plusOnesMeals: [],
    },
  });

  const attending = watch("attending");
  const plusOnesCount = watch("plusOnesCount");
  const plusOnesMeals = watch("plusOnesMeals");

  // Reset plusOnesMeals when plusOnesCount changes
  useEffect(() => {
    if (plusOnesCount === 0) {
      setValue("plusOnesMeals", []);
    } else {
      const newMeals = Array(plusOnesCount).fill("regular");
      setValue("plusOnesMeals", newMeals);
    }
  }, [plusOnesCount, setValue]);

  useEffect(() => {
    if (!token) {
      setError("No RSVP token provided");
      setLoading(false);
      return;
    }

    if (isError) {
      setError("Token not found");
      setLoading(false);
      return;
    }

    if (rsvpData) {
      setLoading(false);
    }
  }, [rsvpData, token, isError, dataLoading]);

  const onSubmit = async (data: RsvpFormData) => {
    if (!token) {
      toast.error("RSVP token not found");
      return;
    }

    try {
      await submitRsvp.mutateAsync({
        token,
        attending: data.attending,
        plusOnesCount: data.plusOnesCount,
        mealPreference: data.mealPreference,
        plusOnesMeals: data.plusOnesMeals || [],
      });
      setSubmitted(true);
      toast.success("תודה! אישור ההגעה שלכם התקבל");
    } catch (error: any) {
      toast.error(error.message || "שגיאה בשליחת אישור ההגעה");
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !rsvpData || isError) {
    return <RSVPError />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md card-shadow">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">תודה רבה!</h2>
            <p className="text-muted-foreground mb-6">
              אישור ההגעה שלכם התקבל בהצלחה. אנחנו שמחים שתהיו איתנו בחתונה!
            </p>
            <p className="text-sm text-muted-foreground">
              אם יש שינויים, אנא צרו קשר ישירות
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const guest = rsvpData;

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <Card className="card-shadow">
          <CardHeader className="text-center border-b border-border pb-6">
            <CardTitle className="text-2xl font-bold text-foreground">
              אישור הגעה
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              שלום {guest?.name} 👋
            </p>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Attendance */}
              <div>
                <label className="text-sm font-medium text-right block mb-4">
                  אתם מגיעים לחתונה?
                </label>
                <div className="space-y-2">
                  <Controller
                    name="attending"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`w-full p-4 rounded-lg border-2 transition-all font-medium text-lg ${
                            field.value
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-background text-foreground hover:border-accent/50"
                          }`}
                        >
                          ✓ כן, אני מגיע/ה
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`w-full p-4 rounded-lg border-2 transition-all font-medium text-lg ${
                            !field.value
                              ? "border-red-500 bg-red-50 text-red-600"
                              : "border-border bg-background text-foreground hover:border-red-300"
                          }`}
                        >
                          ✗ לא, לא מגיע/ה
                        </button>
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Plus Ones Count */}
              {attending && (
                <div>
                  <label className="text-sm font-medium text-right block mb-3">
                    כמה אנשים נוספים תביאו?
                  </label>
                  <Controller
                    name="plusOnesCount"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(val) => field.onChange(Number(val))}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - רק אני</SelectItem>
                          <SelectItem value="1">1 - אני ועוד אחד</SelectItem>
                          <SelectItem value="2">2 - אני ועוד שניים</SelectItem>
                          <SelectItem value="3">3 - אני ועוד שלושה</SelectItem>
                          <SelectItem value="4">4 - אני ועוד ארבעה</SelectItem>
                          <SelectItem value="5">5 - אני ועוד חמישה</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {/* Meal Preferences */}
              {attending && (
                <div className="space-y-6 border-t border-border pt-6">
                  {/* Main Guest Meal */}
                  <div>
                    <label className="text-sm font-medium text-right block mb-3">
                      🍽️ תזונה שלך
                    </label>
                    <Controller
                      name="mealPreference"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-right">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mealOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Plus Ones Meals */}
                  {plusOnesCount > 0 && (
                    <div className="space-y-4">
                      {Array.from({ length: plusOnesCount }).map((_, index) => (
                        <div key={index}>
                          <label className="text-sm font-medium text-right block mb-3">
                            🍽️ תזונה מלווה {index + 1}
                          </label>
                          <Controller
                            name={`plusOnesMeals.${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value || "regular"}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="text-right">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {mealOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-lg font-medium"
                disabled={submitRsvp.isPending}
              >
                {submitRsvp.isPending ? "שולח..." : "שלחו אישור הגעה"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                אם יש שינויים, אתם יכולים לחזור לטופס זה בכל עת
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
