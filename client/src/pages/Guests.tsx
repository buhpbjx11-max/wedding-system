import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Edit2, Trash2, Copy, Check, Send } from "lucide-react";
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

const roleOptions = [
  { value: "regular", label: "רגיל" },
  { value: "vip", label: "VIP" },
  { value: "bridesmaid", label: "שושבין/ת הכלה" },
  { value: "groomsman", label: "שושבין/ת החתן" },
];

export default function Guests() {
  const { data: guests, isLoading, refetch } = trpc.guests.list.useQuery();
  const createGuest = trpc.guests.create.useMutation();
  const updateGuest = trpc.guests.update.useMutation();
  const deleteGuest = trpc.guests.delete.useMutation();
  const generateRsvpToken = trpc.rsvp.generateToken.useMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedGuestId, setCopiedGuestId] = useState<number | null>(null);
  const [generatingTokenFor, setGeneratingTokenFor] = useState<number | null>(null);
  const [guestTokens, setGuestTokens] = useState<Record<number, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(guestSchema) as any,
    defaultValues: {
      group: "mutual",
      role: "regular",
    },
  });

  const selectedRole = watch("role");

  const filteredGuests = useMemo(() => {
    if (!guests) return [];

    return guests.filter((guest) => {
      const matchesSearch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGroup = filterGroup === "all" || guest.group === filterGroup;

      return matchesSearch && matchesGroup;
    });
  }, [guests, searchTerm, filterGroup]);

  const onSubmit = async (data: any) => {
    try {
      if (editingGuest) {
        await updateGuest.mutateAsync({
          guestId: editingGuest.id,
          ...data,
        });
        toast.success("אורח עודכן בהצלחה");
      } else {
        await createGuest.mutateAsync(data);
        toast.success("אורח נוסף בהצלחה");
      }
      reset();
      setEditingGuest(null);
      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "שגיאה בשמירת אורח");
    }
  };

  const handleEdit = (guest: any) => {
    setEditingGuest(guest);
    Object.keys(guest).forEach((key) => {
      if (key in guest) {
        setValue(key as keyof GuestFormData, guest[key]);
      }
    });
    setDialogOpen(true);
  };

  const handleDelete = async (guestId: number) => {
    if (!window.confirm("אתם בטוחים שברצונכם למחוק אורח זה?")) return;

    try {
      await deleteGuest.mutateAsync({ guestId });
      toast.success("אורח נמחק בהצלחה");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "שגיאה במחיקת אורח");
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGuest(null);
    reset();
  };

  const handleGenerateRsvpLink = async (guestId: number) => {
    try {
      setGeneratingTokenFor(guestId);
      const result = await generateRsvpToken.mutateAsync({ guestId });
      setGuestTokens((prev) => ({ ...prev, [guestId]: result.token }));
      toast.success("קישור הזמנה נוצר בהצלחה");
    } catch (error: any) {
      toast.error("שגיאה ביצירת קישור הזמנה");
    } finally {
      setGeneratingTokenFor(null);
    }
  };

  const handleCopyLink = (guestId: number, token: string) => {
    const rsvpLink = `${window.location.origin}/guest-rsvp/${token}`;
    navigator.clipboard.writeText(rsvpLink);
    setCopiedGuestId(guestId);
    toast.success("קישור הועתק ללוח העריכה");
    setTimeout(() => setCopiedGuestId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-4xl font-bold text-foreground">מוזמנים</h1>
          <p className="text-muted-foreground mt-1">
            {filteredGuests.length} {filteredGuests.length === 1 ? "אורח" : "אורחים"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => {
                setEditingGuest(null);
                reset();
              }}
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסיפו אורח
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">
                {editingGuest ? "ערכו אורח" : "הוסיפו אורח חדש"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="text-sm font-medium text-right block mb-2">שם *</label>
                <Input {...register("name")} placeholder="שם האורח" className="text-right" />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 text-right">{(errors.name as any)?.message}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="text-sm font-medium text-right block mb-2">טלפון</label>
                <Input {...register("phone")} placeholder="0501234567" className="text-right" />
              </div>

              {/* Group Field */}
              <div>
                <label className="text-sm font-medium text-right block mb-2">צד *</label>
                <Select
                  defaultValue={editingGuest?.group || "mutual"}
                  onValueChange={(value) => setValue("group", value)}
                >
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

              {/* Guest Type - Radio Buttons */}
              <div>
                <label className="text-sm font-medium text-right block mb-3">סוג אורח *</label>
                <div className="space-y-2">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue("role", option.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-right font-medium ${
                        selectedRole === option.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-background text-foreground hover:border-accent/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 flex-row-reverse pt-4">
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1"
                  disabled={createGuest.isPending || updateGuest.isPending}
                >
                  {createGuest.isPending || updateGuest.isPending ? "שומר..." : "שמרו"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-row-reverse">
        <div className="flex-1">
          <Input
            placeholder="חפשו אורח..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-right"
          />
        </div>
        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger className="w-40 text-right">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הצדדים</SelectItem>
            <SelectItem value="bride">צד הכלה</SelectItem>
            <SelectItem value="groom">צד החתן</SelectItem>
            <SelectItem value="mutual">משותף</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Guests List */}
      <div className="space-y-4">
        {filteredGuests.length > 0 ? (
          filteredGuests.map((guest) => (
            <Card key={guest.id} className="card-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-row-reverse gap-4">
                  <div className="text-right flex-1">
                    <p className="font-semibold text-foreground">{guest.name}</p>
                    {guest.phone && (
                      <p className="text-sm text-muted-foreground">{guest.phone}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-row-reverse">
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                        {guest.group === "bride"
                          ? "צד הכלה"
                          : guest.group === "groom"
                          ? "צד החתן"
                          : "משותף"}
                      </span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {guest.role === "vip"
                          ? "VIP"
                          : guest.role === "bridesmaid"
                          ? "שושבין/ת הכלה"
                          : guest.role === "groomsman"
                          ? "שושבין/ת החתן"
                          : "אורח רגיל"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-row-reverse flex-shrink-0">
                    {/* Generate/Copy RSVP Link Button */}
                    {guestTokens[guest.id] ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(guest.id, guestTokens[guest.id])}
                        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                        title="העתק קישור הזמנה"
                      >
                        {copiedGuestId === guest.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateRsvpLink(guest.id)}
                        disabled={generatingTokenFor === guest.id}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        title="צרו קישור הזמנה"
                      >
                        {generatingTokenFor === guest.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(guest)}
                      title="ערכו אורח"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(guest.id)}
                      className="text-red-500 hover:text-red-600"
                      title="מחקו אורח"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-shadow">
            <CardContent className="pt-6 text-center text-muted-foreground">
              לא נמצאו אורחים
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
