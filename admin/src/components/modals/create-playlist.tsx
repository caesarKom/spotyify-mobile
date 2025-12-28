import { ImageIcon, Upload, X } from "lucide-react"
import { useState } from "react"

interface CreateProps {
  name: string
  description?: string
  isPublic?: boolean
  owner?: string
}

interface Props {
  onClose: () => void
  onUpload: (data: CreateProps, coverImage:File) => void
}

const CreatePlayListModal = ({ onClose, onUpload }: Props) => {

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPreviewUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }


  const handleUpload = async () => {
    if (!formData.name) {
      alert("Please fill in required field (name)")
      return
    }
    const data = {
      name: formData.name,
      description: formData.description,
      isPublic: formData.isPublic,
    }

    onUpload(data as unknown as CreateProps, coverImage as File)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create Playlist</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Cover Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-linear-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-white/50" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="cover-upload-new"
                />
                <label
                  htmlFor="cover-upload-new"
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition"
                >
                  <Upload size={16} />
                  Choose Image
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG, GIF, WEBP (Max 10MB)
                </p>
              </div>
            </div>
          </div>
         
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
              className="rounded"
            />
            <label className="text-sm font-medium">Public</label>
          </div>
         
         
         
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePlayListModal
