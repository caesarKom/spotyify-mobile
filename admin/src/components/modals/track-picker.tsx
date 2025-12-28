import { X, Plus, Check } from "lucide-react"
import { useRef, useState } from "react"
import { apiRequest } from "../../config/api"
import toast from "react-hot-toast"
import { debounce } from "lodash"

interface Track {
  _id: string
  title: string
  artist: string
}

interface Props {
  playlistId: string
  onClose: () => void
  onAdded: () => void
  setMusic: React.Dispatch<React.SetStateAction<Track[]>>
  setPage: (page:number) => void
  setHasMore: (value:boolean) => void
  page: number
  hasMore: boolean
  music: Track[]
  existingTrackIds: string[] | undefined
}
const LIMIT = 20

const TrackPickerModal = ({ playlistId, onClose, onAdded, setMusic, setPage,setHasMore, page, hasMore, music,existingTrackIds }: Props) => {

  const [search, setSearch] = useState("")
  const [genre, setGenre] = useState("")
  const [artist, setArtist] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const observerRef = useRef<IntersectionObserver | null>(null)

/* ---------------- FETCH PAGE ---------------- */
  const fetchPage = async (pageToLoad: number, reset = false) => {
    const params = new URLSearchParams({
      page: pageToLoad.toString(),
      limit: LIMIT.toString(),
      ...(search && { search }),
      ...(genre && { genre }),
      ...(artist && { artist }),
    })

    const res = await apiRequest(`/music?${params}`)
    const data = await res.json()

    if (data.success) {
      setMusic(prev => [...prev, ...(data.music ?? [])])
      setPage(pageToLoad)
      setHasMore(
        data.pagination.currentPage < data.pagination.totalPages
      )
    }
  }

   /* ---------------- INFINITE SCROLL ---------------- */
  const observeLast = (node: HTMLDivElement | null) => {
  if (!hasMore || !node) return

  if (observerRef.current) observerRef.current.disconnect()

  observerRef.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fetchPage(page + 1)
    }
  })

  observerRef.current.observe(node)
}

  /* ---------------- SEARCH (DEBOUNCE, NO EFFECT) ---------------- */
  const debouncedSearch = useRef(
    debounce((value: string) => {
      fetchPage(1, true)
    }, 300)
  ).current

  const handleSearch = (value: string) => {
    setSearch(value)
    debouncedSearch(value)
  }

  /* ---------------- FILTER CHANGE ---------------- */
  const handleFilterChange = (type: "genre" | "artist", value: string) => {
    if (type === "genre") setGenre(value)
    if (type === "artist") setArtist(value)
    fetchPage(1, true)
  }

  /* ---------------- MULTI SELECT ---------------- */
  const toggleSelect = (id: string) => {
  setSelected(prev => {
    const next = new Set(prev)

    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }

    return next
  })
}

  /* ---------------- ADD SELECTED ---------------- */
  const addSelected = async () => {
  try {
    for (const id of selected) {
      await apiRequest(`/playlist/${playlistId}/tracks`, {
        method: "PATCH",
        body: JSON.stringify({ musicId: id }),
      })
    }

    toast.success(`Added ${selected.size} tracks`)
    onAdded()
    onClose()
  } catch (err) {
    toast.error("Failed to add tracks")
  }
}

   return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded-xl p-4 max-h-[85vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-3">
          <h2 className="font-bold">Add tracks</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* SEARCH */}
        <input
          placeholder="Search..."
          className="w-full border px-3 py-2 rounded mb-2"
          onChange={e => handleSearch(e.target.value)}
        />

        {/* FILTERS */}
        <div className="flex gap-2 mb-3">
          <input
            placeholder="Genre"
            className="border px-2 py-1 rounded w-1/2"
            onChange={e => handleFilterChange("genre", e.target.value)}
          />
          <input
            placeholder="Artist"
            className="border px-2 py-1 rounded w-1/2"
            onChange={e => handleFilterChange("artist", e.target.value)}
          />
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {music.map((track, index) => {
            const isLast = index === music.length - 1
            const disabled = existingTrackIds?.includes(track._id)
            const checked = selected.has(track._id)

            return (
              <div
                key={track._id}
                 ref={isLast ? observeLast : undefined}
                className={`flex justify-between items-center px-3 py-2 rounded
                  ${disabled ? "bg-gray-200 opacity-50" : "bg-gray-100"}`}
              >
                <div>
                  <p className="text-sm font-medium">{track.title}</p>
                  <p className="text-xs text-gray-500">{track.artist}</p>
                </div>

                {!disabled && (
                  <button onClick={() => toggleSelect(track._id)}>
                    {checked ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* ADD SELECTED */}
        {selected.size > 0 && (
          <button
            onClick={addSelected}
            className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg"
          >
            Add selected ({selected.size})
          </button>
        )}

        {!hasMore && (
          <p className="text-center text-xs text-gray-400 mt-3">
            End of results
          </p>
        )}
      </div>
    </div>
  )
}

export default TrackPickerModal
