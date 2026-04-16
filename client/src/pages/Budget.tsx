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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const budgetCategories = [
  { value: "venue", label: "מקום אירוח" },
  { value: "catering", label: "קייטרינג" },
  { value: "flowers", label: "פרחים" },
  { value: "photography", label: "צילום" },
  { value: "music", label: "מוזיקה" },
  { value: "decoration", label: "עיצוב" },
  { value: "invitations", label: "הזמנות" },
  { value: "other", label: "אחר" },
];

const budgetSchema = z.object({
  category: z.string(),
  description: z.string().optional(),
  budgeted: z.number().min(0),
  spent: z.number().min(0),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetItem {
  id: number;
  category: string;
  description?: string;
  budgeted: number;
  spent: number;
}

export default function Budget() {
  // Using local state for budget items (no backend integration yet)

  const [items, setItems] = useState<BudgetItem[]>([
    { id: 1, category: "venue", description: "מקום אירוח", budgeted: 5000, spent: 5000 },
    { id: 2, category: "catering", description: "קייטרינג", budgeted: 3000, spent: 2500 },
    { id: 3, category: "flowers", description: "פרחים", budgeted: 1000, spent: 800 },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      category: "venue",
      budgeted: 0,
      spent: 0,
    },
  });

  const stats = useMemo(() => {
    const totalBudgeted = items.reduce((sum, item) => sum + (item.budgeted || 0), 0);
    const totalSpent = items.reduce((sum, item) => sum + (item.spent || 0), 0);
    const remaining = totalBudgeted - totalSpent;
    const percentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

    return { totalBudgeted, totalSpent, remaining, percentage };
  }, [items]);

  const onSubmit = async (data: BudgetFormData) => {
    try {
      const newItem: BudgetItem = {
        id: Date.now(),
        ...data,
      };
      setItems([...items, newItem]);
      toast.success("פריט תקציב נוסף");
      reset();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהוספת פריט");
    }
  };

  const handleDelete = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("פריט נמחק");
  };



  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground">התקציב</h1>
        <p className="text-muted-foreground mt-1">ניהול הוצאות החתונה שלכם</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              תקציב כולל
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-foreground">
              ₪{stats.totalBudgeted.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-accent text-right">
              הוצאות עד כה
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-accent">
              ₪{stats.totalSpent.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 text-right">
              עדיין זמין
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className={`text-2xl font-bold ${stats.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₪{stats.remaining.toFixed(0)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              שימוש
            </CardTitle>
          </CardHeader>
          <CardContent className="text-right">
            <div className="text-2xl font-bold text-foreground">{stats.percentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="card-shadow">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">התקדמות הוצאות</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-accent h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Items */}
      <Card className="card-shadow">
        <CardHeader className="flex items-center justify-between flex-row-reverse">
          <CardTitle className="text-right">פריטי תקציב</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 ml-2" />
                הוסיפו פריט
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">הוסיפו פריט תקציב</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-right block mb-2">קטגוריה</label>
                  <Select defaultValue="venue" onValueChange={(val) => setValue("category", val)}>
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-right block mb-2">תיאור</label>
                  <Input
                    {...register("description")}
                    placeholder="תיאור קצר"
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-right block mb-2">תקציב</label>
                  <Input
                    type="number"
                    {...register("budgeted", { valueAsNumber: true })}
                    placeholder="0"
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-right block mb-2">הוצאות</label>
                  <Input
                    type="number"
                    {...register("spent", { valueAsNumber: true })}
                    placeholder="0"
                    className="text-right"
                  />
                </div>

                <div className="flex gap-3 flex-row-reverse pt-4">
                  <Button type="submit" className="bg-accent hover:bg-accent/90 flex-1">
                    שמרו
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => {
              const categoryLabel = budgetCategories.find((c) => c.value === item.category)?.label;
              const percentage =
                item.budgeted > 0 ? Math.round((item.spent / item.budgeted) * 100) : 0;
              const isOverBudget = item.spent > item.budgeted;

              return (
                <div
                  key={item.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3 flex-row-reverse">
                    <div className="flex-1 text-right">
                      <div className="font-medium text-foreground">{categoryLabel}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-right text-sm">
                    <div>
                      <p className="text-muted-foreground">תקציב</p>
                      <p className="font-medium">₪{item.budgeted.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">הוצאות</p>
                      <p className={`font-medium ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
                        ₪{item.spent.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">שימוש</p>
                      <p className={`font-medium ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
                        {percentage}%
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isOverBudget ? "bg-red-500" : "bg-accent"}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
