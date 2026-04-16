import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Table {
  id: string;
  name: string;
  chairs: number;
  x: number;
  y: number;
  color: string;
  seats: { [key: number]: number | null }; // seat number -> guest id
}

const colors = ["#a4d4ae", "#f4a6a6", "#b8d4f1", "#f4d4a6", "#d4a6f4"];

export default function Seating() {
  const { data: guests, isLoading: guestsLoading } = trpc.guests.list.useQuery();
  const { data: rsvpData, isLoading: rsvpLoading } = trpc.rsvp.summary.useQuery();

  const [tables, setTables] = useState<Table[]>([
    {
      id: "1",
      name: "שולחן 1",
      chairs: 8,
      x: 100,
      y: 100,
      color: colors[0],
      seats: {},
    },
    {
      id: "2",
      name: "שולחן 2",
      chairs: 8,
      x: 350,
      y: 100,
      color: colors[1],
      seats: {},
    },
  ]);

  const [selectedSeat, setSelectedSeat] = useState<{ tableId: string; seatNum: number } | null>(
    null
  );

  // Get confirmed guests only
  const confirmedGuests = useMemo(() => {
    if (!guests || !rsvpData) return [];
    return guests.slice(0, rsvpData.confirmed); // Simplified for now
  }, [guests, rsvpData]);

  // Get assigned guests
  const assignedGuestIds = useMemo(() => {
    const assigned = new Set<number>();
    tables.forEach((table) => {
      Object.values(table.seats).forEach((guestId) => {
        if (guestId !== null) assigned.add(guestId);
      });
    });
    return assigned;
  }, [tables]);

  const unassignedGuests = confirmedGuests.filter((g) => !assignedGuestIds.has(g.id));

  const handleAddTable = () => {
    const newTable: Table = {
      id: Date.now().toString(),
      name: `שולחן ${tables.length + 1}`,
      chairs: 8,
      x: 100 + (tables.length % 3) * 250,
      y: 100 + Math.floor(tables.length / 3) * 250,
      color: colors[tables.length % colors.length],
      seats: {},
    };
    setTables([...tables, newTable]);
    toast.success("שולחן חדש נוסף");
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(tables.filter((t) => t.id !== tableId));
    toast.success("שולחן נמחק");
  };

  const handleAssignGuest = (tableId: string, seatNum: number, guestId: number) => {
    setTables(
      tables.map((table) => {
        if (table.id === tableId) {
          return {
            ...table,
            seats: { ...table.seats, [seatNum]: guestId },
          };
        }
        return table;
      })
    );
    setSelectedSeat(null);
    toast.success("אורח הוקצה לכיסא");
  };

  const handleUnassignGuest = (tableId: string, seatNum: number) => {
    setTables(
      tables.map((table) => {
        if (table.id === tableId) {
          const newSeats = { ...table.seats };
          delete newSeats[seatNum];
          return { ...table, seats: newSeats };
        }
        return table;
      })
    );
    toast.success("אורח הוסר מהכיסא");
  };

  const handleChangeChairs = (tableId: string, newChairs: number) => {
    setTables(
      tables.map((table) => {
        if (table.id === tableId) {
          return { ...table, chairs: Math.max(1, newChairs) };
        }
        return table;
      })
    );
  };

  if (guestsLoading || rsvpLoading || !guests) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground">סידורי ישיבה</h1>
        <p className="text-muted-foreground mt-1">
          {confirmedGuests.length} אורחים אישרו הגעה
        </p>
      </div>

      {/* Hall Layout */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">תכנון הולה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-muted rounded-lg p-8 min-h-96 overflow-auto border-2 border-border">
            {/* Tables */}
            {tables.map((table) => (
              <div
                key={table.id}
                className="absolute"
                style={{ left: `${table.x}px`, top: `${table.y}px` }}
              >
                {/* Table Center */}
                <div
                  className="rounded-full w-28 h-28 flex items-center justify-center text-white font-bold shadow-lg cursor-move hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: table.color }}
                  title={table.name}
                >
                  <div className="text-center">
                    <div className="text-sm">{table.name}</div>
                    <div className="text-xs opacity-75">{table.chairs} כיסאות</div>
                  </div>
                </div>

                {/* Seats around table */}
                <div className="absolute inset-0 w-28 h-28">
                  {Array.from({ length: table.chairs }).map((_, i) => {
                    const angle = (i / table.chairs) * Math.PI * 2;
                    const radius = 65;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    const guestId = table.seats[i] || null;
                    const guest = guests?.find((g) => g.id === guestId);

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (guestId) {
                            handleUnassignGuest(table.id, i);
                          } else {
                            setSelectedSeat({ tableId: table.id, seatNum: i });
                          }
                        }}
                        className={`absolute w-9 h-9 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                          guestId
                            ? "bg-green-500 text-white hover:bg-red-500 cursor-pointer"
                            : "bg-white border-2 border-dashed border-gray-300 hover:border-accent hover:bg-accent/5"
                        }`}
                        style={{
                          left: `calc(50% + ${x}px - 18px)`,
                          top: `calc(50% + ${y}px - 18px)`,
                        }}
                        title={guest ? guest.name : "פנוי"}
                      >
                        {guest ? guest.name.substring(0, 1) : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">אין שולחנות עדיין</p>
                  <p className="text-sm">לחצו על "שולחן חדש" כדי להתחיל</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table Management */}
      <Card className="card-shadow">
        <CardHeader className="flex items-center justify-between flex-row-reverse">
          <CardTitle className="text-right">שולחנות</CardTitle>
          <Button onClick={handleAddTable} className="bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 ml-2" />
            שולחן חדש
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: table.color }}
                />
                <div className="flex-1 text-right">
                  <div className="font-medium text-foreground">{table.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(table.seats).length} / {table.chairs} מיוצב
                  </div>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={table.chairs}
                  onChange={(e) => handleChangeChairs(table.id, Number(e.target.value))}
                  className="w-16 text-right"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTable(table.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guest Assignment */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">
            אורחים לא מוקצים ({unassignedGuests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSeat ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-right">
                בחרו אורח להקצאה לכיסא
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {unassignedGuests.map((guest) => (
                  <button
                    key={guest.id}
                    onClick={() => {
                      handleAssignGuest(selectedSeat.tableId, selectedSeat.seatNum, guest.id);
                    }}
                    className="p-3 text-right border border-border rounded-lg hover:bg-accent/10 hover:border-accent transition-all font-medium"
                  >
                    {guest.name}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedSeat(null)}
              >
                ביטול
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {unassignedGuests.length > 0 ? (
                unassignedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="p-3 text-right border border-border rounded-lg bg-muted text-sm font-medium"
                  >
                    {guest.name}
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  כל האורחים מוקצים! 🎉
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="bg-accent/10 border border-accent rounded-lg p-4 text-right">
        <p className="text-sm text-foreground font-medium mb-2">💡 טיפים:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• לחצו על כיסא ריק כדי להקצות אורח</li>
          <li>• לחצו על כיסא תפוס כדי להסיר אורח</li>
          <li>• שנו את מספר הכיסאות בכל שולחן</li>
        </ul>
      </div>
    </div>
  );
}
