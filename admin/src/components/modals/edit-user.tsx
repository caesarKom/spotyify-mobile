import { ImageIcon, Upload, X } from "lucide-react"
import { useState } from "react"
import { apiRequest } from "../../config/api"
import { useAuthImage } from "../../hooks/useAuthImage"
import type { UserProps } from "../../pages/user-page"
import toast from "react-hot-toast"

interface Props {
  user: UserProps
  onClose: () => void
  onSave: (data: UserProps) => void
}

const EditUserModal = ({ user, onClose, onSave }: Props) => {
  const avatarUrl = useAuthImage(user.profile.avatar!)
  const [formData, setFormData] = useState({
    role: user?.role || "",
    firstName: user.profile?.firstName || "",
    lastName: user.profile?.lastName || "",
    bio: user.profile?.bio || "",
    favoriteGenres: user.preferences?.favoriteGenres?.join(", ") || "",
    isVerified: user?.isVerified || false,
    mediaToken: user?.mediaToken || ""
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPreviewUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    // First update the user data
    await onSave(formData as unknown as UserProps)

    // Then upload cover image if selected
    if (avatar) {
      const formData = new FormData()
      formData.append("image", avatar)

      try {
        const res = await apiRequest(`/user/avatar`, {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (data.success) {
         toast.success("Avatar image updated successfully")
        }
      } catch (err: any) {
        toast.error("Error uploading avatar: " + err.message)
      }
    }
  }

  const generateMediaToken = async () => {
    setIsGeneratingToken(true)
    try {
      // Generuj token
      const res = await apiRequest(`/media-token`, {
        method: "POST",
      })
      const data = await res.json()
      
      if (data.success && data.token) {
        // Aktualizuj stan lokalny
        setFormData({ ...formData, mediaToken: data.token })
        
        // Wyślij aktualizację do API
        try {
          const updateRes = await apiRequest(`/user/profile/${user._id}`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mediaToken: data.token })
          })
          
          const updateData = await updateRes.json()
          
          if (updateData.success) {
            toast.success("Media token generated and saved successfully")
            // Możesz też odświeżyć dane użytkownika, jeśli potrzebujesz
            if (onSave) {
              onSave({ ...user, mediaToken: data.token } as UserProps)
            }
          } else {
            toast.error("Failed to save media token")
          }
        } catch (updateErr: any) {
          toast.error("Error saving media token: " + updateErr.message)
          // Zachowaj token w stanie lokalnym mimo błędu
        }
      } else {
        toast.error("Failed to generate media token")
      }
    } catch (err: any) {
      toast.error("Error generating media token: " + err.message)
    } finally {
      setIsGeneratingToken(false)
    }
  }

  // Funkcja do resetowania tokena
  const resetMediaToken = async () => {
    try {
      setIsGeneratingToken(true)
      const updateRes = await apiRequest(`/user/profile/${user._id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaToken: "" })
      })
      
      const updateData = await updateRes.json()
      
      if (updateData.success) {
        setFormData({ ...formData, mediaToken: "" })
        toast.success("Media token reset successfully")
        if (onSave) {
          onSave({ ...user, mediaToken: "" } as UserProps)
        }
      } else {
        toast.error("Failed to reset media token")
      }
    } catch (err: any) {
      toast.error("Error resetting media token: " + err.message)
    } finally {
      setIsGeneratingToken(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit User: {user.username}</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Avatar Image</label>
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
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Favorite Genres (comma separated)
            </label>
            <input
              value={formData.favoriteGenres}
              onChange={(e) =>
                setFormData({ ...formData, favoriteGenres: e.target.value })
              }
              placeholder="rock, pop, jazz"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User Role</label>
            <input
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              placeholder="user | admin"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Media Token</label>
            <div className="flex items-center space-x-2">
              <input
                value={formData.mediaToken}
                disabled
                placeholder="Click Generate to create media token"
                className="w-full border rounded-lg px-3 py-2 bg-gray-50"
              />
              <div className="flex flex-col space-y-2">
                {formData.mediaToken === "" ? (
                  <button
                    onClick={generateMediaToken}
                    disabled={isGeneratingToken}
                    className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isGeneratingToken ? "Generating..." : "Generate"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={generateMediaToken}
                      disabled={isGeneratingToken}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                    >
                      {isGeneratingToken ? "Regenerating..." : "Regenerate"}
                    </button>
                    <button
                      onClick={resetMediaToken}
                      disabled={isGeneratingToken}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>
            {formData.mediaToken && (
              <p className="text-xs text-gray-500 mt-1">
                Token: {formData.mediaToken}
              </p>
            )}
          </div>
          <div className="flex items-center">
            <label className="relative flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isVerified}
                onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                className="
                  peer
                  h-6 w-6
                  appearance-none
                  rounded-lg
                  border-2 border-gray-300
                  bg-white
                  checked:border-blue-500 checked:bg-blue-500
                  hover:border-blue-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  transition-all duration-200
                  cursor-pointer
                "
              />
              <svg
                className="
                  absolute
                  left-0
                  h-6 w-6
                  pointer-events-none
                  fill-none
                  stroke-white
                  stroke-[3px]
                  opacity-0
                  peer-checked:opacity-100
                  transition-opacity duration-200
                "
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 12l5 5l10 -10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-gray-700 font-medium">Is Verified</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUserModal