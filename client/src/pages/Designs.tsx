import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Image, Type, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type DesignType = "text" | "image";
type Design = { id: number; title: string; type: DesignType; content: string };

export default function Designs() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: designs, isLoading } = trpc.designs.list.useQuery();
  const createDesign = trpc.designs.create.useMutation({ onSuccess: () => utils.designs.list.invalidate() });
  const updateDesign = trpc.designs.update.useMutation({ onSuccess: () => utils.designs.list.invalidate() });
  const deleteDesign = trpc.designs.delete.useMutation({ onSuccess: () => utils.designs.list.invalidate() });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Design | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DesignType>("text");
  const [content, setContent] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setType("text");
    setContent("");
    setDialogOpen(true);
  };

  const openEdit = (d: Design) => {
    setEditing(d);
    setTitle(d.title);
    setType(d.type);
    setContent(d.content);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("יש למלא כותרת ותוכן");
      return;
    }
    try {
      if (editing) {
        await updateDesign.mutateAsync({ designId: editing.id, title: title.trim(), type, content: content.trim() });
        toast.success("עיצוב עודכן");
      } else {
        await createDesign.mutateAsync({ title: title.trim(), type, content: content.trim() });
        toast.success("עיצוב נוסף");
      }
      setDialogOpen(false);
    } catch {
      toast.error("שגיאה בשמירה");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("למחוק עיצוב זה?")) return;
    try {
      await deleteDesign.mutateAsync({ designId: id });
      toast.success("עיצוב נמחק");
    } catch {
      toast.error("שגיאה במחיקה");
    }
  };

  const copyContent = (d: Design) => {
    navigator.clipboard.writeText(d.content);
    setCopiedId(d.id);
    toast.success("תוכן הועתק");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendWithDesign = (d: Design) => {
    navigate("/invitations");
    toast.info(`עברו להזמנות כדי לשלוח עם "${d.title}"`);
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
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">עיצובים וטקסטים</h1>
          <p className="text-muted-foreground mt-0.5">ספריית תוכן לשימוש חוזר</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={openCreate}>
              <Plus className="w-4 h-4 ml-1.5" />
              הוסיפו פריט
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">
                {editing ? "עריכת עיצוב" : "עיצוב / טקסט חדש"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">כותרת *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="שם הפריט" className="text-right" />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">סוג</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setType("text")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      type === "text" ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/40"
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span className="text-sm font-medium">טקסט</span>
                  </button>
                  <button
                    onClick={() => setType("image")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      type === "image" ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent/40"
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-sm font-medium">תמונה</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5 text-right">
                  {type === "text" ? "תוכן הטקסט *" : "כתובת URL של תמונה *"}
                </label>
                {type === "text" ? (
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={5}
                    placeholder="הכניסו את הטקסט כאן..."
                    className="text-right"
                  />
                ) : (
                  <Input
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                  />
                )}
              </div>

              {type === "image" && content && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={content} alt="תצוגה מקדימה" className="w-full max-h-40 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                </div>
              )}

              <div className="flex gap-2 flex-row-reverse pt-1">
                <Button onClick={handleSave} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={createDesign.isPending || updateDesign.isPending}>
                  שמירה
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {designs && designs.length > 0 ? (
        <div className="space-y-3">
          {designs.map(d => (
            <Card key={d.id} className="transition-colors hover:border-accent/40">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between flex-row-reverse gap-3">
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <p className="font-medium">{d.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {d.type === "text" ? (
                          <><Type className="w-3 h-3 ml-1 inline" />טקסט</>
                        ) : (
                          <><Image className="w-3 h-3 ml-1 inline" />תמונה</>
                        )}
                      </Badge>
                    </div>
                    {d.type === "text" ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{d.content}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground truncate" dir="ltr">{d.content}</p>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {/* Copy */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyContent(d as Design)} title="העתק תוכן">
                      {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    {/* Edit */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(d as Design)} title="ערוך">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    {/* Delete */}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(d.id)} title="מחק">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="flex justify-center gap-4 mb-4 opacity-30">
              <Type className="w-8 h-8" />
              <Image className="w-8 h-8" />
            </div>
            <p className="font-medium mb-1">אין עיצובים וטקסטים עדיין</p>
            <p className="text-sm mb-4">צרו ספריית תוכן לשימוש חוזר בהזמנות</p>
            <Button onClick={openCreate} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4 ml-1.5" />
              הוסיפו פריט ראשון
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
