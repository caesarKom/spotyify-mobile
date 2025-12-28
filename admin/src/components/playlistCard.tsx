import { Edit, Music, Trash2 } from "lucide-react";
import { useAuthImage } from "../hooks/useAuthImage";
import { apiRequest } from "../config/api";
import toast from "react-hot-toast";
import type { Playlist } from "../types";

interface Props {
    playlist: Playlist;
    setEditingPlaylist: (playlist:Playlist) => void
}

export const PlaylistCard = ({ playlist, setEditingPlaylist }: Props) => {
    const imageSrc = useAuthImage(playlist.coverImage as string);

     const deletePlaylist = async (id:string) => {
        if (!confirm('Are you sure you want to delete this playlist?')) return;
        try {
          const res = await apiRequest(`/playlist/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            toast.success('Playlist deleted successfully');
            window.location.reload()
          }
        } catch (err:any) {
          toast.error('Error deleting playlist: ' + err.message);
        }
      };

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                <div className="aspect-square bg-linear-to-br from-purple-400 to-indigo-500 relative">
                  {imageSrc ? (
                    <img src={imageSrc} className="w-full h-full object-cover" alt={playlist.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm mb-1 truncate">{playlist.name}</h3>
                  <p className="text-gray-600 text-xs mb-2 truncate">{playlist.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{playlist.trackCount || 0} tracks</span>
                    <span>{playlist.genres || ""} genres</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingPlaylist(playlist)}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 text-xs rounded hover:bg-blue-100 transition"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => deletePlaylist(playlist._id as string)}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-1.5 text-xs rounded hover:bg-red-100 transition"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            
    )
}