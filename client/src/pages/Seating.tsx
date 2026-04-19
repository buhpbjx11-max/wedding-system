import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";

interface Table {
  id: string;
  name: string;
  chairs: number;
  color: string;
  seats: Record<number, number | null>; // seat index → guestId
}

const TABLE_COLORS = ["#a4d4ae", "#f4a6a6", "#b8d4f1", "#f4d4a6", "#d4a6f4", "#a6e4f4"];

interface GuestWithAttending {
  id: number;
  name: string;
  group: string;
  role?: string | null;
  status?: string | null;
  plusOnes?: number | null;
  totalSeats: number;
}

export default function Seating() {
  const { data: guests, isLoading: guestsLoading } = trpc.guests.list.useQuery();
  const { data: rsvpSummary } = trpc.rsvp.summary.useQuery();

  const [tables, setTables] = useState<Table[]>([
    { id: "1", name: "שולחן 1", chairs: 8, color: TABLE_COLORS[0], seats: {} },
    { id: "2", name: "שולחן 2", chairs: 8, color: TABLE_COLORS[1], seats: {} },
  ]);
  const [selectedGuest, setSelectedGuest] = useState<GuestWithAttending | null>(null);

  // Build confirmed guests list with total seats (person + plus-ones)
  const confirmedGuests = useMemo((): GuestWithAttending[] => {
    if (!guests) return [];
    return guests
      .filter(g => g.status === "confirmed")
      .map(g => ({
        id: g.id,
        name: g.name,
        group: g.group,
        role: g.role,
        status: g.status,
        plusOnes: g.plusOnes ?? 0,
        totalSeats: 1 + (g.plusOnes ?? 0),
      }));
  }, [guests]);

  // Which guests are already fully assigned
  const assignedGuestIds = useMemo(() => {
    const ids = new Set<number>();
    tables.forEach(t => Object.values(t.seats).forEach(id => { if (id !== null) ids.add(id); }));
    return ids;
  }, [tables]);

  const unassignedGuests = confirmedGuests.filter(g => !assignedGuestIds.has(g.id));

  // Total seats across all tables
  const totalSeats = tables.reduce((sum, t) => sum + t.chairs, 0);
  const usedSeats = tables.reduce((sum, t) => sum + Object.values(t.seats).filter(v => v !== null).length, 0);
  const totalAttending = rsvpSummary?.totalAttending ?? 0;
  const seatsShortfall = totalAttending - totalSeats;

  const addTable = () => {
    const id = Date.now().toString();
    setTables(prev => [...prev, {
      id, name: `שולחן ${prev.length + 1}`,
      chairs: 8, color: TABLE_COLORS[prev.length % TABLE_COLORS.length], seats: {},
    }]);
  };

  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    toast.success("שולחן נמחק");
  };

  const changeChairs = (id: string, chairs: number) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, chairs: Math.max(1, chairs) } : t));
  };

  // Assign guest to a table starting at a given seat; occupies totalSeats consecutive seats
  const assignGuest = (tableId: string, startSeat: number, guest: GuestWithAttending) => {
    const table = tables.find(t => t.id === tableId)!;
    const needed = guest.totalSeats;

    // Find enough consecutive free seats starting from startSeat
    const freeSeats: number[] = [];
    for (let i = 0; i < table.chairs && freeSeats.length < needed; i++) {
      if (!table.seats[i]) freeSeats.push(i);
    }

    if (freeSeats.length < needed) {
      toast.error(`אין מספיק מקום! ${guest.name} צריך ${needed} כיסאות, יש ${freeSeats.length} פנויים`);
      return;
    }

    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const newSeats = { ...t.seats };
      freeSeats.slice(0, needed).forEach(s => { newSeats[s] = guest.id; });
      return { ...t, seats: newSeats };
    }));
    setSelectedGuest(null);
    toast.success(`${guest.name} הוקצה (${needed} כיסאות)`);
  };

  // Remove guest from all seats in a table
  const unassignGuest = (tableId: string, guestId: number) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const newSeats = { ...t.seats };
      Object.keys(newSeats).forEach(k => {
        if (newSeats[Number(k)] === guestId) delete newSeats[Number(k)];
      });
      return { ...t, seats: newSeats };
    }));
  };

  if (guestsLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">סידורי ישיבה</h1>
          <p className="text-muted-foreground mt-0.5">
            {confirmedGuests.length} אורחים אישרו • {totalAttending} מקומות נדרשים • {totalSeats} כיסאות זמינים
          </p>
        </div>
        <Button onClick={addTable} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="w-4 h-4 ml-1.5" />
          שולחן חדש
        </Button>
      </div>

      {/* Warning if not enough seats */}
      {seatsShortfall > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 flex-row-reverse">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            חסרים {seatsShortfall} כיסאות! יש {totalSeats} כיסאות אך {totalAttending} אורחים מגיעים
          </p>
        </div>
      )}

      {confirmedGuests.length === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border border-border flex-row-reverse">
          <Users className="w-5 h-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            עדיין אין אורחים מאושרים. כשאורחים ישלחו אישור הגעה הם יופיעו כאן.
          </p>
        </div>
      )}

      {/* Two-column layout: tables + unassigned */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {tables.map(table => {
            const usedInTable = Object.values(table.seats).filter(v => v !== null).length;
            const freeInTable = table.chairs - usedInTable;

            // Unique guest IDs in this table
            const guestIdsInTable = Array.from(new Set(Object.values(table.seats).filter((v): v is number => v !== null)));

            return (
              <Card key={table.id} className="overflow-hidden">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: table.color }} />
                      <span className="font-medium">{table.name}</span>
                      <span className="text-sm text-muted-foreground">{usedInTable}/{table.chairs}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min="1" max="30"
                        value={table.chairs}
                        onChange={e => changeChairs(table.id, Number(e.target.value))}
                        className="w-14 h-7 text-center text-sm"
                      />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteTable(table.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4">
                  {/* Seat grid */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Array.from({ length: table.chairs }, (_, i) => {
                      const gId = table.seats[i] ?? null;
                      const g = gId ? guests?.find(g => g.id === gId) : null;
                      const isFirst = gId && Object.entries(table.seats).find(([k, v]) => v === gId)?.[0] === String(i);

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (gId) unassignGuest(table.id, gId);
                            else if (selectedGuest) assignGuest(table.id, i, selectedGuest);
                          }}
                          title={g ? `${g.name} — לחץ להסרה` : selectedGuest ? `הקצה את ${selectedGuest.name}` : "כיסא פנוי"}
                          className={`w-8 h-8 rounded-full text-[10px] font-bold border-2 transition-all flex items-center justify-center
                            ${gId
                              ? "bg-accent text-accent-foreground border-accent/60 hover:bg-red-400 hover:border-red-400"
                              : selectedGuest
                                ? "border-dashed border-accent hover:bg-accent/10 cursor-pointer"
                                : "border-dashed border-muted-foreground/30 bg-muted/30"
                            }`}
                        >
                          {isFirst && g ? g.name.charAt(0) : gId && !isFirst ? "+" : ""}
                        </button>
                      );
                    })}
                  </div>

                  {/* Guests in this table */}
                  {guestIdsInTable.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
                      {guestIdsInTable.map(gId => {
                        const g = guests?.find(g => g.id === gId);
                        if (!g) return null;
                        const count = Object.values(table.seats).filter(v => v === gId).length;
                        return (
                          <button key={gId}
                            onClick={() => unassignGuest(table.id, gId)}
                            className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            title="לחץ להסרה">
                            {g.name}{count > 1 ? ` (${count})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedGuest && freeInTable < selectedGuest.totalSeats && (
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠ לא מספיק מקום ({selectedGuest.name} צריך {selectedGuest.totalSeats}, יש {freeInTable} פנויים)
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Unassigned guests — 1/3 */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-right text-sm font-medium">
                לא מוקצים ({unassignedGuests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {selectedGuest && (
                <div className="mb-3 p-2 rounded-lg bg-accent/10 border border-accent/30 text-right">
                  <p className="text-xs text-accent font-medium">נבחר: {selectedGuest.name}</p>
                  <p className="text-xs text-muted-foreground">צריך {selectedGuest.totalSeats} כיסאות</p>
                  <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => setSelectedGuest(null)}>
                    ביטול
                  </Button>
                </div>
              )}

              {unassignedGuests.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">כל האורחים הוקצו 🎉</p>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {unassignedGuests.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGuest(g.id === selectedGuest?.id ? null : g)}
                      className={`w-full text-right px-3 py-2 rounded-lg border transition-all text-sm ${
                        selectedGuest?.id === g.id
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border hover:border-accent/50 hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium">{g.name}</span>
                      {g.totalSeats > 1 && (
                        <span className="text-xs text-muted-foreground mr-1.5">({g.totalSeats} כיסאות)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedGuest && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  לחצו על כיסא פנוי בשולחן להקצאה
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
