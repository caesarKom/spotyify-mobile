import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../config/api";
import EditMusicModal from "../components/modals/edit-music";
import UploadMusicModal from "../components/modals/upload-music";
import { MusicCard } from "../components/musicCard";
import toast from "react-hot-toast";
import debounce from 'lodash/debounce';
import Pagination from "../components/pagination";

export type Track = {
  _id: string
  music: File
  title: string
  artist:string
  album?: string
  genre?: string
  tags?: string[]
  isPublic?: boolean
  coverImage?:string
  playCount?: number
  likeCount?: number
}

const MusicManagerPage = () => {
  const [music, setMusic] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [editingMusic, setEditingMusic] = useState<Track|null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // debounce 300 ms
const debouncedSearch = useMemo(
  () =>
    debounce((text: string) => {
      setSearchTerm(text);
      setIsTyping(false); 
    }, 300),
  []
);

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const text = e.target.value;
  setSearchValue(text);
  setIsTyping(true);
  debouncedSearch(text);
};

  useEffect(() => {
   if (!isTyping) fetchMusic();
  }, [searchTerm, pagination.currentPage, isTyping]);

  const fetchMusic = async () => {
    setLoading(true);
    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

      const res = await apiRequest(`/music?page=${pagination.currentPage}&limit=20${searchParam}`);
      const data = await res.json();
      if (data.success) {
        setMusic(data.music);
        setPagination(data.pagination);
      }
    } catch (err:any) {
      console.error('Error fetching music:', err);
      toast.error('Error loading music: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMusic = async (id:string, updates:Track) => {
    try {
      const res = await apiRequest(`/music/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Song updated successfully');
        setEditingMusic(null);
        fetchMusic();
      }
    } catch (err:any) {
      toast.error('Error updating song: ' + err.message);
    }
  };

  const uploadMusic = async (formData:Track, coverImage:File) => {
    try {
      const res = await apiRequest('/music/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
       if (coverImage) {
          const coverFormData = new FormData();
          coverFormData.append('image', coverImage);
          
          try {
            await apiRequest(`/music/${data.data._id}/cover`, {
              method: 'POST',
              body: coverFormData
            });
          } catch (err) {
            console.error('Error uploading cover:', err);
          }
        }
        toast.success('Song uploaded successfully');
        setShowUploadModal(false);
        fetchMusic();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err:any) {
      toast.error('Error uploading: ' + err.message);
    }
  };

  // const filteredMusic = music.filter(m =>
  //   m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   m.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search music..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="ml-4 flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <Plus size={20} />
          Upload Music
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading music...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {music.map((track) => (
              <MusicCard key={track._id} track={track} setEditingMusic={setEditingMusic} />
            )
             )}
          </div>

          {pagination.totalPages > 1 && (
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={page => setPagination({ ...pagination, currentPage: page})}
            />
          )}
        </>
      )}

      {editingMusic && (
        <EditMusicModal
          music={editingMusic}
          onClose={() => setEditingMusic(null)}
          onSave={(updates:Track) => updateMusic(editingMusic._id, updates)}
        />
      )}

      {showUploadModal && (
        <UploadMusicModal
          onClose={() => setShowUploadModal(false)}
          onUpload={(FormData, coverImage) => uploadMusic(FormData, coverImage)}
        />
      )}
    </div>
  );
};

export default MusicManagerPage