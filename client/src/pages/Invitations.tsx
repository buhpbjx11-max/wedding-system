import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus } from "lucide-react";

export default function Invitations() {
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
        <CardContent className="text-right">
          <p className="text-muted-foreground mb-6">עדיין לא נשלחו הזמנות</p>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 ml-2" />
            שלחו הזמנה חדשה
          </Button>
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
