import debounce from "lodash/debounce"
import { Plus, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { apiRequest } from "../config/api"
import toast from "react-hot-toast"
import { PlaylistCard } from "../components/playlistCard"
import CreatePlayListModal from "../components/modals/create-playlist"
import EditPlaylistModal from "../components/modals/edit-playlist"
import type { Playlist } from "../types"

const PlayList = () => {
  const [playlist, setPlaylist] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  })

  // debounce 300 ms
  const debouncedSearch = useMemo(
    () =>
      debounce((text: string) => {
        setSearchTerm(text)
        setIsTyping(false)
      }, 300),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setSearchValue(text)
    setIsTyping(true)
    debouncedSearch(text)
  }

  useEffect(() => {
    if (!isTyping) fetchPlaylist()
  }, [searchTerm, isTyping])

  const fetchPlaylist = async () => {
    setLoading(true)
    try {
      const searchParam = searchTerm
        ? `&search=${encodeURIComponent(searchTerm)}`
        : ""

      const res = await apiRequest(`/playlist/public`)
      const data = await res.json()

      if (data.success) {
        setPlaylist(data.data)
        setPagination(data.pagination)
      }
    } catch (err: any) {
      console.error("Error fetching music:", err)
      toast.error("Error loading music: " + err.message)
    } finally {
      setLoading(false)
    }
  }

 const uploadPlaylist = async (formData:Playlist, coverImage:File) => {
    try {
      const res = await apiRequest('/playlist', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
       if (coverImage) {
          const coverFormData = new FormData();
          coverFormData.append('image', coverImage);
          
          try {
            await apiRequest(`/playlist/${data.data._id}/cover`, {
              method: 'POST',
              body: coverFormData
            });
          } catch (err) {
            console.error('Error uploading cover:', err);
          }
        }
        toast.success('Playlist uploaded successfully');
        setShowUploadModal(false);
        fetchPlaylist();
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err:any) {
      toast.error('Error uploading: ' + err.message);
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
  try {
    const res = await apiRequest(`/playlist/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (data.success) {
      toast.success("Playlist updated")
      setEditingPlaylist(null)
      fetchPlaylist()
    }
  } catch (err: any) {
    toast.error("Error updating playlist: " + err.message)
  }
}

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search playlist..."
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
          Add Playlist
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading playlist...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlist.map((playlist) => (
              <PlaylistCard key={playlist._id} playlist={playlist} setEditingPlaylist={setEditingPlaylist} />
            )
             )}
          </div>

          
        </>
      )}

      {showUploadModal && (
        <CreatePlayListModal onClose={() => setShowUploadModal(false)} onUpload={(FormData, coverImage) => uploadPlaylist(FormData, coverImage) } />
      )

      }

      {editingPlaylist && (
        <EditPlaylistModal
    playlist={editingPlaylist}
    onClose={() => setEditingPlaylist(null)}
    onUpdated={fetchPlaylist}
  />
      )}
    </div>
  )
}

export default PlayList
