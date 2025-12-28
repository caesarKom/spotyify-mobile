import { X, Trash2, Upload, ImageIcon, Plus } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { apiRequest } from "../../config/api"
import { useAuthImage } from "../../hooks/useAuthImage"
import type { Playlist, Track } from "../../types"
import TrackPickerModal from "./track-picker"

interface Props {
  playlist: Playlist
  onClose: () => void
  onUpdated: () => void // refetch playlist
}

const EditPlaylistModal = ({ playlist, onClose, onUpdated }: Props) => {
  const existingImage = useAuthImage(playlist.coverImage as string)

  const [formData, setFormData] = useState({
    name: playlist.name,
    description: playlist.description || "",
    isPublic: playlist.isPublic,
  })

  const [tracks, setTracks] = useState<Track[] | undefined>(
    playlist.tracks || []
  )
  const [cover, setCover] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(existingImage || null)
  const [music, setMusic] = useState<Track[]>([])
  const [showTrackPicker, setShowTrackPicker] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const openPicker = async () => {
    const res = await apiRequest("/music?page=1&limit=20")
    const data = await res.json()

    if (data.success) {
      setMusic(data.music)
      setPage(1)
      setHasMore(data.pagination.currentPage < data.pagination.totalPages)
      setShowTrackPicker(true)
    }
  }

  /* ---------------- COVER ---------------- */
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCover(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPreview(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  /* ---------------- PLAYLIST META ---------------- */
  const saveMeta = async () => {
    await apiRequest(`/playlist/${playlist._id}`, {
      method: "PUT",
      body: JSON.stringify(formData),
    })
  }

  /* ---------------- COVER UPLOAD ---------------- */
  const uploadCover = async () => {
    if (!cover) return

    const fd = new FormData()
    fd.append("image", cover)

    await apiRequest(`/playlist/${playlist._id}/cover`, {
      method: "POST",
      body: fd,
    })
  }

  /* ---------------- REMOVE TRACK ---------------- */
  const removeTrack = async (musicId: string) => {
    try {
      await apiRequest(`/playlist/${playlist._id}/tracks/${musicId}`, {
        method: "DELETE",
      })

      setTracks((prev) => prev?.filter((t) => t._id !== musicId))
      toast.success("Track removed")
    } catch {
      toast.error("Cannot remove track")
    }
  }

  /* ---------------- SAVE ALL ---------------- */
  const handleSave = async () => {
    try {
      await saveMeta()
      await uploadCover()
      toast.success("Playlist updated")
      onUpdated()
      onClose()
    } catch {
      toast.error("Update failed")
    }
  }

  return (
    <>
      {showTrackPicker && (
        <TrackPickerModal
          playlistId={playlist._id as string}
          onClose={() => setShowTrackPicker(false)}
          onAdded={() => {
            setShowTrackPicker(false)
            onUpdated()
          }}
          music={music || []}
          page={page}
          hasMore={hasMore}
          setMusic={setMusic}
          setPage={setPage}
          setHasMore={setHasMore}
          existingTrackIds={playlist.tracks?.map((t) => t._id)}
        />
      )}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Edit Playlist</h2>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          {/* COVER */}
          <div className="flex gap-4 mb-6">
            <div className="w-32 h-32 rounded-lg bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-white/50 w-12 h-12" />
              )}
            </div>

            <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
              <Upload size={16} />
              Change cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </label>
          </div>

          {/* META */}
          <div className="space-y-4 mb-6">
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Playlist name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <textarea
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  setFormData({ ...formData, isPublic: e.target.checked })
                }
              />
              Public playlist
            </label>
          </div>

          {/* TRACKS */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Tracks ({tracks?.length})</h3>

            <div className="space-y-2">
              {tracks?.map((track) => (
                <div
                  key={track._id}
                  className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.artist}</p>
                  </div>

                  <button
                    onClick={() => removeTrack(track._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {tracks?.length === 0 && (
                <p className="text-sm text-gray-500">Playlist is empty</p>
              )}
            </div>

            {/* TrackPicker */}
            <button
              onClick={openPicker}
              className="mt-3 flex items-center gap-1 text-purple-600 text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add track
            </button>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default EditPlaylistModal
