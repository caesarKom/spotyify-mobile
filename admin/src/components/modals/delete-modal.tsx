import { AlertTriangleIcon } from "lucide-react"
import { useState } from "react"
import type { UserProps } from "../../pages/user-page"

interface Props {
  user: UserProps
  onClose: () => void
  onConfirm: () => Promise<void>
}


export const DeleteUserModal = ({ user, onClose, onConfirm }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Error deleting user:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Delete {user.username}?</h3>
            <p className="text-gray-600 text-sm">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete <span className="font-semibold">{user.username}</span> ({user.email})? 
          All user data will be permanently removed.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}