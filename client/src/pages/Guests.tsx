import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Copy, Check, Send, Star, Crown, MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const guestSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  phone: z.string().optional(),
  group: z.enum(["bride", "groom", "mutual"]),
  role: z.enum(["regular", "vip", "bridesmaid", "groomsman"]),
});

type GuestFormData = z.infer<typeof guestSchema>;
type Guest = {
  id: number;
  name: string;
  phone?: string | null;
  group: "bride" | "groom" | "mutual";
  role?: "regular" | "vip" | "bridesmaid" | "groomsman" | null;
  status?: string | null;
  plusOnes?: number | null;
};

const ROLE_SORT: Record<string, number> = {
  bridesmaid: 0,
  groomsman: 0,
  vip: 1,
  regular: 2,
};

const roleLabel = (role: string | null | undefined, group: string) => {
  if (role === "vip") return "VIP";
  if (role === "bridesmaid") return "שושבינת הכלה";
  if (role === "groomsman") return "שושבין החתן";
  return null;
};

const statusLabel = (status: string | null | undefined) => {
  if (status === "confirmed") return { label: "אישר הגעה", color: "text-green-600 bg-green-50 border-green-200" };
  if (status === "declined") return { label: "לא מגיע", color: "text-red-600 bg-red-50 border-red-200" };
  return { label: "ממתין", color: "text-muted-foreground bg-muted border-border" };
};

const GROUP_CONFIG = [
  { key: "bride", label: "צד הכלה" },
  { key: "groom", label: "צד החתן" },
  { key: "mutual", label: "משותף" },
] as const;

export default function Guests() {
  const { data: guests, isLoading, refetch } = trpc.guests.list.useQuery();
  const createGuest = trpc.guests.create.useMutation();
  const updateGuest = trpc.guests.update.useMutation();
  const deleteGuest = trpc.guests.delete.useMutation();
  const generateRsvpToken = trpc.rsvp.generateToken.useMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [tokens, setTokens] = useState<Record<number, string>>({});

  const { register, handleSubmit, reset, setValue, watch } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema) as any,
    defaultValues: { group: "mutual", role: "regular" },
  });
  const selectedRole = watch("role");
  const selectedGroup = watch("group");

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    const s = searchTerm.toLowerCase();
    return guests.filter(
      g => g.name.toLowerCase().includes(s) || g.phone?.toLowerCase().includes(s)
    );
  }, [guests, searchTerm]);

  const groupedGuests = useMemo(() => {
    return GROUP_CONFIG.map(({ key, label }) => ({
      key,
      label,
      guests: filteredGuests
        .filter(g => g.group === key)
        .sort((a, b) => (ROLE_SORT[a.role ?? "regular"] ?? 2) - (ROLE_SORT[b.role ?? "regular"] ?? 2)),
    }));
  }, [filteredGuests]);

  const onSubmit = async (data: GuestFormData) => {
    try {
      if (editingGuest) {
        await updateGuest.mutateAsync({ guestId: editingGuest.id, ...data });
        toast.success("אורח עודכן");
      } else {
        await createGuest.mutateAsync(data);
        toast.success("אורח נוסף");
      }
      reset();
      setEditingGuest(null);
      setDialogOpen(false);
      refetch();
    } catch {
      toast.error("שגיאה בשמירת אורח");
    }
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setValue("name", guest.name);
    setValue("phone", guest.phone ?? "");
    setValue("group", guest.group);
    setValue("role", (guest.role as GuestFormData["role"]) ?? "regular");
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("למחוק אורח זה?")) return;
    try {
      await deleteGuest.mutateAsync({ guestId: id });
      toast.success("אורח נמחק");
      refetch();
    } catch {
      toast.error("שגיאה במחיקה");
    }
  };

  const toggleRole = async (guest: Guest, toggleType: "honorary" | "vip") => {
    let newRole: GuestFormData["role"];
    if (toggleType === "vip") {
      newRole = guest.role === "vip" ? "regular" : "vip";
    } else {
      const honoraryRole = guest.group === "bride" ? "bridesmaid" : "groomsman";
      newRole = guest.role === honoraryRole ? "regular" : honoraryRole;
    }
    try {
      await updateGuest.mutateAsync({ guestId: guest.id, role: newRole });
      refetch();
    } catch {
      toast.error("שגיאה בעדכון תפקיד");
    }
  };

  const handleGenerateLink = async (id: number) => {
    setGeneratingFor(id);
    try {
      const { token } = await generateRsvpToken.mutateAsync({ guestId: id });
      setTokens(prev => ({ ...prev, [id]: token }));
      toast.success("קישור RSVP נוצר");
    } catch {
      toast.error("שגיאה ביצירת קישור");
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyLink = (id: number, token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/guest-rsvp/${token}`);
    setCopiedId(id);
    toast.success("קישור הועתק");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendWhatsApp = (guest: Guest, token: string) => {
    const link = `${window.location.origin}/guest-rsvp/${token}`;
    const msg = `שלום ${guest.name}! 💕\nמוזמנים/ות לחתונה שלנו.\nנשמח לאישור הגעה:\n${link}`;
    const phone = guest.phone?.replace(/\D/g, "").replace(/^0/, "972") ?? "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalGuests = guests?.length ?? 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">מוזמנים</h1>
          <p className="text-muted-foreground mt-0.5">{totalGuests} מוזמנים סה"כ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditingGuest(null); reset(); } }}>
          <DialogTrigger asChild>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => { setEditingGuest(null); reset(); }}
            >
              <Plus className="w-4 h-4 ml-1.5" />
              הוסיפו אורח
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {editingGuest ? "עריכת אורח" : "אורח חדש"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">שם *</label>
                <Input {...register("name")} placeholder="שם האורח" className="text-right" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">טלפון</label>
                <Input {...register("phone")} placeholder="0501234567" className="text-right" dir="ltr" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">צד</label>
                <Select defaultValue={editingGuest?.group ?? "mutual"} onValueChange={v => setValue("group", v as any)}>
                  <SelectTrigger className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">צד הכלה</SelectItem>
                    <SelectItem value="groom">צד החתן</SelectItem>
                    <SelectItem value="mutual">משותף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">תפקיד</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "regular", label: "אורח רגיל" },
                    { value: "vip", label: "VIP" },
                    { value: selectedGroup === "bride" ? "bridesmaid" : "groomsman",
                      label: selectedGroup === "bride" ? "שושבינת הכלה" : "שושבין החתן" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("role", opt.value as any)}
                      className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all text-right ${
                        selectedRole === opt.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-row-reverse pt-2">
                <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={createGuest.isPending || updateGuest.isPending}>
                  שמירה
                </Button>
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => { setDialogOpen(false); setEditingGuest(null); reset(); }}>
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="חיפוש לפי שם או טלפון..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="text-right"
      />

      {/* Grouped Lists */}
      {groupedGuests.map(({ key, label, guests: groupGuests }) => (
        <div key={key}>
          <h2 className="text-base font-semibold text-foreground mb-3 text-right flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground font-normal">({groupGuests.length})</span>
            {label}
          </h2>

          {groupGuests.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4 border border-dashed rounded-lg mb-4">
              אין מוזמנים ב{label}
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {groupGuests.map(guest => {
                const statusInfo = statusLabel(guest.status);
                const roleBadge = roleLabel(guest.role, guest.group);
                const isHonorary = guest.role === "bridesmaid" || guest.role === "groomsman";

                return (
                  <Card key={guest.id} className={`transition-colors ${isHonorary ? "border-accent/40" : ""}`}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between flex-row-reverse gap-3">
                        {/* Guest Info */}
                        <div className="text-right flex-1 min-w-0">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <p className="font-medium text-foreground">{guest.name}</p>
                            {roleBadge && (
                              <Badge variant="outline" className="text-xs border-accent text-accent">
                                {roleBadge}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-1 flex-wrap">
                            {guest.phone && (
                              <span className="text-xs text-muted-foreground" dir="ltr">{guest.phone}</span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {(guest.plusOnes ?? 0) > 0 && (
                              <span className="text-xs text-muted-foreground">+{guest.plusOnes}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          {/* RSVP Link */}
                          {tokens[guest.id] ? (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600"
                              onClick={() => copyLink(guest.id, tokens[guest.id])} title="העתק קישור RSVP">
                              {copiedId === guest.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500"
                              onClick={() => handleGenerateLink(guest.id)}
                              disabled={generatingFor === guest.id} title="צור קישור RSVP">
                              {generatingFor === guest.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Send className="w-3.5 h-3.5" />}
                            </Button>
                          )}

                          {/* WhatsApp */}
                          {tokens[guest.id] && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600"
                              onClick={() => sendWhatsApp(guest as Guest, tokens[guest.id])} title="שלח WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Toggle Honorary */}
                          <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${isHonorary ? "text-accent" : "text-muted-foreground"}`}
                            onClick={() => toggleRole(guest as Guest, "honorary")}
                            title={isHonorary ? "הסר שושבין/ת" : "הפוך לשושבין/ת"}>
                            <Crown className="w-3.5 h-3.5" />
                          </Button>

                          {/* Toggle VIP */}
                          <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${guest.role === "vip" ? "text-yellow-500" : "text-muted-foreground"}`}
                            onClick={() => toggleRole(guest as Guest, "vip")}
                            title={guest.role === "vip" ? "הסר VIP" : "הגדר VIP"}>
                            <Star className="w-3.5 h-3.5" />
                          </Button>

                          {/* Edit */}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => openEdit(guest as Guest)} title="ערוך">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Delete */}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(guest.id)} title="מחק">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {totalGuests === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>עדיין אין מוזמנים</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
