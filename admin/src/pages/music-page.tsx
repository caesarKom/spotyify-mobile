import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "../config/api";
import EditMusicModal from "../components/modals/edit-music";
import UploadMusicModal from "../components/modals/upload-music";
import { MusicCard } from "../components/musicCard";

const MusicManagerPage = () => {
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMusic, setEditingMusic] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  useEffect(() => {
    fetchMusic();
  }, [pagination.currentPage]);

  const fetchMusic = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/music?page=${pagination.currentPage}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setMusic(data.music);
        setPagination(data.pagination);
      }
    } catch (err:any) {
      console.error('Error fetching music:', err);
      alert('Error loading music: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMusic = async (id, updates) => {
    try {
      const res = await apiRequest(`/music/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        alert('Song updated successfully');
        setEditingMusic(null);
        fetchMusic();
      }
    } catch (err) {
      alert('Error updating song: ' + err.message);
    }
  };

  const uploadMusic = async (formData) => {
    try {
      const res = await apiRequest('/music/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Song uploaded successfully');
        setShowUploadModal(false);
        fetchMusic();
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert('Error uploading: ' + err.message);
    }
  };

  const filteredMusic = music.filter(m =>
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search music..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredMusic.map((track) => (
              <MusicCard key={track._id} track={track} setEditingMusic={setEditingMusic} />
            )
             )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
                className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-white border rounded-lg">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
                className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {editingMusic && (
        <EditMusicModal
          music={editingMusic}
          onClose={() => setEditingMusic(null)}
          onSave={(updates) => updateMusic(editingMusic._id, updates)}
        />
      )}

      {showUploadModal && (
        <UploadMusicModal
          onClose={() => setShowUploadModal(false)}
          onUpload={uploadMusic}
        />
      )}
    </div>
  );
};

export default MusicManagerPage