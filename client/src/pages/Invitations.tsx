import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Plus, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

type Audience = "all" | "bride" | "groom" | "shared";

const audienceLabels: Record<Audience, string> = {
  all: "כולם",
  bride: "צד הכלה",
  groom: "צד החתן",
  shared: "משותפים",
};

export default function Invitations() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: invitations, isLoading: invitationsLoading } =
    trpc.invitations.list.useQuery();
  const { data: guests } = trpc.guests.list.useQuery();
  const createInvitation = trpc.invitations.create.useMutation({
    onSuccess: async () => {
      await utils.invitations.list.invalidate();
    },
  });

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    if (audience === "all") return guests;
    if (audience === "shared") return guests.filter(g => g.group === "mutual");
    return guests.filter(g => g.group === audience);
  }, [audience, guests]);

  const resetFlow = () => {
    setStep(1);
    setTitle("");
    setContent("");
    setImageUrlInput("");
    setImageUrls([]);
    setAudience("all");
    setSelectedGuestIds([]);
  };

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      setImageUrls(prev => [...prev, trimmed]);
      setImageUrlInput("");
    } catch {
      toast.error("כתובת תמונה אינה תקינה");
    }
  };

  const toggleGuestSelection = (guestId: number, checked: boolean) => {
    setSelectedGuestIds(prev =>
      checked ? [...prev, guestId] : prev.filter(id => id !== guestId)
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("יש למלא כותרת ותוכן הזמנה");
      setStep(1);
      return;
    }

    try {
      const result = await createInvitation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        imageUrls,
        audience,
        selectedGuestIds,
      });
      toast.success(`נוצרו ${result.createdCount} הזמנות בהצלחה`);
      setOpen(false);
      resetFlow();
    } catch (error: any) {
      toast.error(error?.message || "שגיאה ביצירת הזמנות");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground mb-2">הזמנות</h1>
        <p className="text-muted-foreground">ניהול הזמנות דיגיטליות למוזמנים שלכם</p>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-end gap-2">
            <Mail className="w-5 h-5" />
            הזמנות פעילות
          </CardTitle>
        </CardHeader>
        <CardContent className="text-right space-y-4">
          {invitationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map(invitation => (
                <div
                  key={invitation.id}
                  className="rounded-md border border-border p-3"
                >
                  <p className="font-semibold">{invitation.title || "ללא כותרת"}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {invitation.content || "ללא תוכן"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">עדיין לא נשלחו הזמנות</p>
          )}

          <Dialog
            open={open}
            onOpenChange={isOpen => {
              setOpen(isOpen);
              if (!isOpen) resetFlow();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4 ml-2" />
                שלחו הזמנה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-right">יצירת הזמנה חדשה</DialogTitle>
              </DialogHeader>

              <div className="flex items-center justify-center gap-2 text-sm">
                <span className={step >= 1 ? "text-accent font-semibold" : "text-muted-foreground"}>
                  1. תוכן
                </span>
                <span className="text-muted-foreground">/</span>
                <span className={step >= 2 ? "text-accent font-semibold" : "text-muted-foreground"}>
                  2. קהל יעד
                </span>
                <span className="text-muted-foreground">/</span>
                <span className={step >= 3 ? "text-accent font-semibold" : "text-muted-foreground"}>
                  3. בחירת מוזמנים
                </span>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">כותרת הזמנה</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">תוכן ההזמנה</label>
                    <Textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">תמונות (URL)</label>
                    <div className="flex gap-2">
                      <Input
                        value={imageUrlInput}
                        onChange={e => setImageUrlInput(e.target.value)}
                        placeholder="https://..."
                      />
                      <Button type="button" variant="outline" onClick={addImageUrl}>
                        <ImagePlus className="w-4 h-4" />
                      </Button>
                    </div>
                    {imageUrls.length > 0 && (
                      <div className="space-y-2">
                        {imageUrls.map(url => (
                          <div key={url} className="flex items-center justify-between rounded border p-2">
                            <span className="text-xs text-muted-foreground truncate max-w-[450px]">
                              {url}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setImageUrls(prev => prev.filter(item => item !== url))
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">בחירת קהל יעד</label>
                  {(["all", "bride", "groom", "shared"] as Audience[]).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setAudience(option);
                        setSelectedGuestIds([]);
                      }}
                      className={`w-full rounded-md border p-3 text-right ${
                        audience === option
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border"
                      }`}
                    >
                      {audienceLabels[option]}
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    בחירת מוזמנים ספציפיים (לא חובה). אם לא תבחרו, יישלח לכל הקהל שבחרתם.
                  </label>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded border p-3">
                    {filteredGuests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">אין מוזמנים בקהל זה</p>
                    ) : (
                      filteredGuests.map(guest => (
                        <label
                          key={guest.id}
                          className="flex items-center justify-between rounded border p-2"
                        >
                          <span className="text-sm">{guest.name}</span>
                          <Checkbox
                            checked={selectedGuestIds.includes(guest.id)}
                            onCheckedChange={checked =>
                              toggleGuestSelection(guest.id, Boolean(checked))
                            }
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(prev => Math.max(1, prev - 1))}
                  disabled={step === 1 || createInvitation.isPending}
                >
                  הקודם
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(prev => Math.min(3, prev + 1))}
                    disabled={
                      createInvitation.isPending ||
                      (step === 1 && (!title.trim() || !content.trim()))
                    }
                  >
                    הבא
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createInvitation.isPending || filteredGuests.length === 0}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {createInvitation.isPending ? "שולח..." : "צור הזמנות"}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">טיפים לשליחת הזמנות</CardTitle>
        </CardHeader>
        <CardContent className="text-right space-y-3 text-muted-foreground">
          <p>• שלחו הזמנות דיגיטליות דרך WhatsApp או אימייל</p>
          <p>• כל אורח יקבל קישור ייחודי לאישור הגעה</p>
          <p>• אתם תקבלו עדכון מיידי כשאורח אישר הגעה</p>
        </CardContent>
      </Card>
    </div>
  );
}
