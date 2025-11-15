import { Edit, Music, Trash2 } from "lucide-react";
import { useAuthImage } from "../hooks/useAuthImage";
import { apiRequest } from "../config/api";

export const MusicCard = ({ track, setEditingMusic }) => {
    const imageSrc = useAuthImage(track.coverImage);

     const deleteMusic = async (id:string) => {
        if (!confirm('Are you sure you want to delete this song?')) return;
        try {
          const res = await apiRequest(`/music/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            alert('Song deleted successfully');
            window.location.reload()
          }
        } catch (err:any) {
          alert('Error deleting song: ' + err.message);
        }
      };

    return (
        <div key={track._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-indigo-500 relative">
                  {imageSrc ? (
                    <img src={imageSrc} className="w-full h-full object-cover" alt={track.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm mb-1 truncate">{track.title}</h3>
                  <p className="text-gray-600 text-xs mb-2 truncate">{track.artist}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{track.playCount || 0} plays</span>
                    <span>{track.likeCount || 0} likes</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingMusic(track)}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 text-xs rounded hover:bg-blue-100 transition"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMusic(track._id)}
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