import { useState } from "react";
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
import { Plus, Trash2, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const timelineSchema = z.object({
  time: z.string(),
  event: z.string().min(1, "שם האירוע נדרש"),
  description: z.string().optional(),
  assignee: z.string().optional(),
});

type TimelineFormData = z.infer<typeof timelineSchema>;

interface TimelineEvent {
  id: number;
  time: string;
  event: string;
  description?: string;
  assignee?: string;
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([
    { id: 1, time: "16:00", event: "קבלת פנים", description: "קבלת אורחים", assignee: "דנה" },
    { id: 2, time: "17:00", event: "טקס", description: "טקס הנישואין", assignee: "עומר" },
    { id: 3, time: "18:00", event: "ארוחה", description: "ארוחת ערב", assignee: "צוות" },
    { id: 4, time: "20:00", event: "ריקוד", description: "פתיחת הריקוד", assignee: "דנה & עומר" },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimelineFormData>({
    resolver: zodResolver(timelineSchema) as any,
    defaultValues: {
      time: "18:00",
      event: "",
      description: "",
      assignee: "",
    },
  });

  const onSubmit = async (data: TimelineFormData) => {
    try {
      const newEvent: TimelineEvent = {
        id: Date.now(),
        ...data,
      };
      setEvents([...events, newEvent].sort((a, b) => a.time.localeCompare(b.time)));
      toast.success("אירוע נוסף");
      reset();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "שגיאה בהוספת אירוע");
    }
  };

  const handleDelete = (id: number) => {
    setEvents(events.filter((event) => event.id !== id));
    toast.success("אירוע נמחק");
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newEvents = [...events];
    const [moved] = newEvents.splice(fromIndex, 1);
    newEvents.splice(toIndex, 0, moved);
    setEvents(newEvents);
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground">לוח הזמנים</h1>
        <p className="text-muted-foreground mt-1">תכנון יום החתונה שלכם</p>
      </div>

      {/* Add Event */}
      <Card className="card-shadow">
        <CardHeader className="flex items-center justify-between flex-row-reverse">
          <CardTitle className="text-right">אירועי היום</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 ml-2" />
                הוסיפו אירוע
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">הוסיפו אירוע ליום החתונה</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-right block mb-2">שעה</label>
                  <Input
                    type="time"
                    {...register("time")}
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-right block mb-2">שם האירוע *</label>
                  <Input
                    {...register("event")}
                    placeholder="למשל: טקס, ארוחה, ריקוד"
                    className="text-right"
                  />
                  {errors.event && (
                    <p className="text-xs text-red-500 mt-1 text-right">{(errors.event as any)?.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-right block mb-2">תיאור</label>
                  <Input
                    {...register("description")}
                    placeholder="פרטים נוספים"
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-right block mb-2">אחראי</label>
                  <Input
                    {...register("assignee")}
                    placeholder="שם האחראי"
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
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">אין אירועים עדיין</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Time */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="font-bold text-accent text-lg">{event.time}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-right">
                    <h3 className="font-bold text-foreground text-lg">{event.event}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                    {event.assignee && (
                      <p className="text-xs text-accent mt-2">👤 {event.assignee}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(index, index - 1)}
                        title="הזז למעלה"
                      >
                        ↑
                      </Button>
                    )}
                    {index < events.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReorder(index, index + 1)}
                        title="הזז למטה"
                      >
                        ↓
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visual */}
      {events.length > 0 && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-right">ציר הזמן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-8">
              {/* Timeline line */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent/20" />

              {/* Events */}
              <div className="space-y-8">
                {events.map((event) => (
                  <div key={event.id} className="relative text-right">
                    {/* Dot */}
                    <div className="absolute right-0 top-2 w-4 h-4 bg-accent rounded-full transform translate-x-1.5" />

                    {/* Content */}
                    <div className="pr-8">
                      <div className="font-bold text-accent">{event.time}</div>
                      <div className="font-semibold text-foreground">{event.event}</div>
                      {event.description && (
                        <div className="text-sm text-muted-foreground">{event.description}</div>
                      )}
                      {event.assignee && (
                        <div className="text-xs text-accent mt-1">👤 {event.assignee}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
