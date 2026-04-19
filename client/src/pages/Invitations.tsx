import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, ImagePlus, X, Send, MessageCircle, ChevronRight, CheckCircle2, Phone } from "lucide-react";
import { toast } from "sonner";

type AudienceMode = "all" | "bride" | "groom" | "shared" | "selected" | "exclude";

const audienceLabels: Record<AudienceMode, string> = {
  all: "כולם",
  bride: "צד הכלה בלבד",
  groom: "צד החתן בלבד",
  shared: "משותפים בלבד",
  selected: "מוזמנים נבחרים",
  exclude: "כולם למעט נבחרים",
};

function stepTitle(step: number) {
  return ["תוכן ההזמנה", "אפשרויות", "קהל יעד", "בחירת מוזמנים"][step - 1];
}

interface WhatsappEntry {
  guestId: number;
  name: string;
  phone: string | null;
  token: string;
}

function WhatsappSendDialog({
  open,
  onClose,
  entries,
  invitationContent,
}: {
  open: boolean;
  onClose: () => void;
  entries: WhatsappEntry[];
  invitationContent: string;
}) {
  const [current, setCurrent] = useState(0);
  const [sent, setSent] = useState<Set<number>>(new Set());

  const withPhone = entries.filter(e => e.phone);
  const noPhone = entries.filter(e => !e.phone);

  const entry = withPhone[current] ?? null;

  const buildLink = (e: WhatsappEntry) => {
    const rsvpUrl = `${window.location.origin}/guest-rsvp/${e.token}`;
    const msg = `שלום ${e.name}! 💕\n${invitationContent}\n\nלאישור הגעה: ${rsvpUrl}`;
    const phone = e.phone!.replace(/\D/g, "").replace(/^0/, "972");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleSend = () => {
    if (!entry) return;
    window.open(buildLink(entry), "_blank");
    setSent(prev => new Set(prev).add(entry.guestId));
  };

  const handleNext = () => {
    if (current < withPhone.length - 1) setCurrent(c => c + 1);
  };

  const allSent = sent.size >= withPhone.length;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 justify-end">
            <MessageCircle className="w-5 h-5 text-green-500" />
            שליחה בוואטסאפ
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{sent.size} / {withPhone.length} נשלחו</span>
          <div className="flex gap-1">
            {withPhone.map((e, i) => (
              <div
                key={e.guestId}
                className={`w-2 h-2 rounded-full transition-colors ${
                  sent.has(e.guestId) ? "bg-green-500" : i === current ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {allSent ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <p className="text-lg font-semibold">נשלח לכולם! 🎉</p>
            <p className="text-sm text-muted-foreground">ההזמנות נשלחו ל-{sent.size} מוזמנים</p>
            {noPhone.length > 0 && (
              <p className="text-xs text-yellow-600 bg-yellow-50 rounded p-2">
                ⚠ {noPhone.length} מוזמנים ללא מספר טלפון — לא נשלח להם
              </p>
            )}
            <Button onClick={onClose} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
              סגור
            </Button>
          </div>
        ) : entry ? (
          <div className="space-y-4">
            {/* Current guest card */}
            <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 text-right">
              <p className="text-xs text-muted-foreground mb-0.5">מוזמן {current + 1} מתוך {withPhone.length}</p>
              <p className="text-lg font-bold">{entry.name}</p>
              <div className="flex items-center gap-1.5 justify-end mt-1 text-sm text-muted-foreground">
                <span dir="ltr">{entry.phone}</span>
                <Phone className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Already sent indicator */}
            {sent.has(entry.guestId) && (
              <div className="flex items-center gap-2 justify-center text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>נשלח</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleNext}
                disabled={current >= withPhone.length - 1}
              >
                דלג
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={handleSend}
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                {sent.has(entry.guestId) ? "שלח שוב" : "שלח בוואטסאפ"}
              </Button>
            </div>

            {sent.has(entry.guestId) && current < withPhone.length - 1 && (
              <Button
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleNext}
              >
                הבא
                <ChevronRight className="w-4 h-4 mr-1" />
              </Button>
            )}

            {/* No phone guests warning */}
            {noPhone.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {noPhone.length} מוזמנים ללא טלפון יידולגו
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>אין מוזמנים עם מספר טלפון</p>
            <Button onClick={onClose} className="mt-4" variant="outline">סגור</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Invitations() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [includeRsvpLink, setIncludeRsvpLink] = useState(true);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappEntries, setWhatsappEntries] = useState<WhatsappEntry[]>([]);
  const [lastContent, setLastContent] = useState("");

  const utils = trpc.useUtils();
  const { data: invitations, isLoading } = trpc.invitations.list.useQuery();
  const { data: guests } = trpc.guests.list.useQuery();
  const createInvitation = trpc.invitations.create.useMutation({
    onSuccess: () => utils.invitations.list.invalidate(),
  });
  const prepareWhatsapp = trpc.whatsapp.prepareList.useMutation();

  const relevantGuests = useMemo(() => {
    if (!guests) return [];
    if (audienceMode === "all" || audienceMode === "selected" || audienceMode === "exclude") return guests;
    if (audienceMode === "shared") return guests.filter(g => g.group === "mutual");
    return guests.filter(g => g.group === audienceMode);
  }, [guests, audienceMode]);

  const reset = () => {
    setStep(1); setTitle(""); setContent(""); setImageUrlInput("");
    setImageUrls([]); setIncludeRsvpLink(true); setAudienceMode("all"); setSelectedIds([]);
  };

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    try { new URL(trimmed); setImageUrls(p => [...p, trimmed]); setImageUrlInput(""); }
    catch { toast.error("כתובת URL אינה תקינה"); }
  };

  const toggleId = (id: number, checked: boolean) =>
    setSelectedIds(p => (checked ? [...p, id] : p.filter(x => x !== id)));

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("יש למלא כותרת ותוכן"); setStep(1); return;
    }
    const baseAudience = audienceMode === "selected" || audienceMode === "exclude" ? "all" : (audienceMode as any);
    let guestIds: number[] = [];
    if (audienceMode === "selected") guestIds = selectedIds;
    else if (audienceMode === "exclude")
      guestIds = (guests ?? []).filter(g => !selectedIds.includes(g.id)).map(g => g.id);

    try {
      const result = await createInvitation.mutateAsync({
        title: title.trim(), content: content.trim(), imageUrls,
        audience: baseAudience, selectedGuestIds: guestIds,
      });
      toast.success(`נוצרו ${result.createdCount} הזמנות`);
      setOpen(false);

      // Prepare WhatsApp list
      const savedContent = content.trim();
      const entries = await prepareWhatsapp.mutateAsync({ guestIds: guestIds.length ? guestIds : undefined });
      setLastContent(savedContent);
      setWhatsappEntries(entries);
      setWhatsappOpen(true);
      reset();
    } catch (e: any) {
      toast.error(e?.message || "שגיאה ביצירת הזמנות");
    }
  };

  const needsGuestSelection = audienceMode === "selected" || audienceMode === "exclude";
  const maxStep = needsGuestSelection ? 4 : 3;
  const canAdvance = (step === 1 && title.trim() && content.trim()) || step === 2 || step === 3 || step === 4;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">הזמנות</h1>
        <p className="text-muted-foreground mt-0.5">ניהול שליחת הזמנות למוזמנים</p>
      </div>

      {/* Create Invitation Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
        <DialogTrigger asChild>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Send className="w-4 h-4 ml-2" />
            שלחו הזמנה חדשה
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl" className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-right">
              שלב {step}: {stepTitle(step)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center gap-1.5 my-1">
            {Array.from({ length: maxStep }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-accent" : "bg-muted"}`} />
            ))}
          </div>

          {/* Step 1 — Content */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">כותרת *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת ההזמנה" className="text-right" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">תוכן ההזמנה *</label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="טקסט ההזמנה..." className="text-right" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">תמונה (URL)</label>
                <div className="flex gap-2">
                  <Input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="https://..." dir="ltr"
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImageUrl())} />
                  <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
                {imageUrls.map(url => (
                  <div key={url} className="flex items-center justify-between mt-2 rounded border px-3 py-1.5">
                    <span className="text-xs text-muted-foreground truncate max-w-xs" dir="ltr">{url}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1"
                      onClick={() => setImageUrls(p => p.filter(u => u !== url))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Options */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">בחרו מה לכלול בהזמנה:</p>
              <label className="flex items-center justify-end gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <span className="text-sm font-medium">קישור לאישור הגעה (RSVP)</span>
                <Checkbox checked={includeRsvpLink} onCheckedChange={v => setIncludeRsvpLink(Boolean(v))} />
              </label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-right text-sm text-green-700">
                <MessageCircle className="w-4 h-4 inline ml-1.5" />
                לאחר יצירת ההזמנה תוכלו לשלוח אותה <strong>ישירות לכולם בוואטסאפ</strong>
              </div>
            </div>
          )}

          {/* Step 3 — Audience */}
          {step === 3 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-2">למי לשלוח?</p>
              {(Object.keys(audienceLabels) as AudienceMode[]).map(mode => (
                <button key={mode} type="button"
                  onClick={() => { setAudienceMode(mode); setSelectedIds([]); }}
                  className={`w-full rounded-lg border-2 p-3 text-right text-sm font-medium transition-all ${
                    audienceMode === mode ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/40"
                  }`}>
                  {audienceLabels[mode]}
                </button>
              ))}
            </div>
          )}

          {/* Step 4 — Guest Selection */}
          {step === 4 && needsGuestSelection && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {audienceMode === "selected" ? "בחרו מוזמנים שיקבלו הזמנה:" : "בחרו מוזמנים שלא יקבלו הזמנה:"}
              </p>
              <div className="max-h-64 overflow-y-auto rounded border divide-y">
                {relevantGuests.map(g => (
                  <label key={g.id} className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                    <span className="text-sm">{g.name}</span>
                    <Checkbox checked={selectedIds.includes(g.id)} onCheckedChange={v => toggleId(g.id, Boolean(v))} />
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {selectedIds.length > 0 ? `${selectedIds.length} נבחרו` : "לא נבחרו"}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(p => Math.max(1, p - 1))}
              disabled={step === 1 || createInvitation.isPending}>
              הקודם
            </Button>
            {step < maxStep ? (
              <Button onClick={() => setStep(p => p + 1)} disabled={!canAdvance || createInvitation.isPending}>
                הבא
              </Button>
            ) : (
              <Button onClick={handleSubmit}
                disabled={createInvitation.isPending || prepareWhatsapp.isPending}
                className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {(createInvitation.isPending || prepareWhatsapp.isPending)
                  ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />מכין...</>
                  : <><MessageCircle className="w-4 h-4 ml-2" />צור ושלח בוואטסאפ</>
                }
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Send Dialog */}
      <WhatsappSendDialog
        open={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
        entries={whatsappEntries}
        invitationContent={lastContent}
      />

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-base flex items-center justify-end gap-2">
            <Mail className="w-4 h-4" />
            הזמנות שנוצרו
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="rounded-lg border border-border p-3 text-right">
                  <div className="flex items-start justify-between flex-row-reverse gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{inv.title || "ללא כותרת"}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{inv.content || ""}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      inv.status === "sent" ? "border-green-300 text-green-700 bg-green-50" :
                      inv.status === "failed" ? "border-red-300 text-red-700" : "border-border text-muted-foreground"
                    }`}>
                      {inv.status === "sent" ? "נשלח" : inv.status === "failed" ? "נכשל" : "טיוטה"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">עדיין לא נשלחו הזמנות</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
