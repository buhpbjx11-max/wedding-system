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
import { Image, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Album {
  id: number;
  name: string;
  photos: Photo[];
}

interface Photo {
  id: number;
  url: string;
  caption?: string;
  uploadedBy?: string;
}

export default function Gallery() {
  const [albums, setAlbums] = useState<Album[]>([
    {
      id: 1,
      name: "טקס",
      photos: [
        { id: 1, url: "https://via.placeholder.com/300x300?text=טקס+1", caption: "טקס הנישואין", uploadedBy: "דנה" },
        { id: 2, url: "https://via.placeholder.com/300x300?text=טקס+2", caption: "רגע מיוחד", uploadedBy: "עומר" },
      ],
    },
    {
      id: 2,
      name: "ארוחה",
      photos: [
        { id: 3, url: "https://via.placeholder.com/300x300?text=ארוחה+1", caption: "ארוחת ערב", uploadedBy: "צוות" },
      ],
    },
  ]);

  const [newAlbumName, setNewAlbumName] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) {
      toast.error("שם האלבום נדרש");
      return;
    }
    const newAlbum: Album = {
      id: Date.now(),
      name: newAlbumName,
      photos: [],
    };
    setAlbums([...albums, newAlbum]);
    toast.success("אלבום חדש נוצר");
    setNewAlbumName("");
  };

  const handleDeleteAlbum = (id: number) => {
    setAlbums(albums.filter((a) => a.id !== id));
    if (selectedAlbum === id) setSelectedAlbum(null);
    toast.success("אלבום נמחק");
  };

  const handleAddPhoto = (albumId: number) => {
    if (!newPhotoUrl.trim()) {
      toast.error("קישור התמונה נדרש");
      return;
    }

    setAlbums(
      albums.map((album) => {
        if (album.id === albumId) {
          return {
            ...album,
            photos: [
              ...album.photos,
              {
                id: Date.now(),
                url: newPhotoUrl,
                caption: newPhotoCaption || undefined,
                uploadedBy: "אתם",
              },
            ],
          };
        }
        return album;
      })
    );
    toast.success("תמונה הוספה");
    setNewPhotoUrl("");
    setNewPhotoCaption("");
  };

  const handleDeletePhoto = (albumId: number, photoId: number) => {
    setAlbums(
      albums.map((album) => {
        if (album.id === albumId) {
          return {
            ...album,
            photos: album.photos.filter((p) => p.id !== photoId),
          };
        }
        return album;
      })
    );
    toast.success("תמונה נמחקה");
  };

  const currentAlbum = albums.find((a) => a.id === selectedAlbum);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-4xl font-bold text-foreground">גלריה</h1>
        <p className="text-muted-foreground mt-1">שתפו ואחסנו תמונות מהחתונה שלכם</p>
      </div>

      {/* Create Album */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-right">אלבומים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* New Album Form */}
            <div className="flex gap-2 flex-row-reverse">
              <Input
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="שם אלבום חדש"
                className="text-right"
              />
              <Button
                onClick={handleCreateAlbum}
                className="bg-accent hover:bg-accent/90 flex-shrink-0"
              >
                <Plus className="w-4 h-4 ml-2" />
                אלבום חדש
              </Button>
            </div>

            {/* Albums List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    selectedAlbum === album.id
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-medium text-foreground">{album.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {album.photos.length} תמונות
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Album Details */}
      {currentAlbum && (
        <Card className="card-shadow border-2 border-accent">
          <CardHeader className="flex items-center justify-between flex-row-reverse">
            <CardTitle className="text-right">{currentAlbum.name}</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteAlbum(currentAlbum.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Photo */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-right">הוסיפו תמונה</h3>
              <Input
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="קישור התמונה (URL)"
                className="text-right"
              />
              <Input
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="כיתוב (אופציונלי)"
                className="text-right"
              />
              <Button
                onClick={() => handleAddPhoto(currentAlbum.id)}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Upload className="w-4 h-4 ml-2" />
                הוסיפו תמונה
              </Button>
            </div>

            {/* Photos Grid */}
            {currentAlbum.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentAlbum.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {photo.caption && (
                      <div className="mt-2 text-sm text-muted-foreground text-right">
                        {photo.caption}
                      </div>
                    )}
                    {photo.uploadedBy && (
                      <div className="text-xs text-accent text-right">
                        👤 {photo.uploadedBy}
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePhoto(currentAlbum.id, photo.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>אין תמונות בעדיין</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {albums.length === 0 && (
        <Card className="card-shadow">
          <CardContent className="pt-12 pb-12 text-center">
            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">אין אלבומים עדיין</p>
            <p className="text-sm text-muted-foreground">
              צרו אלבום חדש כדי להתחיל להוסיף תמונות
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <div className="bg-accent/10 border border-accent rounded-lg p-4 text-right">
        <p className="text-sm text-foreground font-medium mb-2">💡 טיפים:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• ארגנו תמונות לאלבומים לפי נושא (טקס, ארוחה, ריקוד)</li>
          <li>• הוסיפו כיתובים לתמונות כדי לשמור על הזיכרונות</li>
          <li>• שתפו את הגלריה עם משפחה וחברים</li>
        </ul>
      </div>
    </div>
  );
}
