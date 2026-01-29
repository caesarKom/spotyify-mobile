import { Edit, Trash2 } from "lucide-react"
import { useAuthImage } from "../hooks/useAuthImage"
import type { UserProps } from "../pages/user-page"
import { useState } from "react"
import { DeleteUserModal } from "./modals/delete-modal"
import { apiRequest } from "../config/api"
import toast from "react-hot-toast"

interface Props {
  user: UserProps
}

const UserWithAvatar = ({ user }: Props) => {
  const avatar = useAuthImage(user.profile.avatar!)
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
        {avatar ? (
          <img
            src={avatar}
            className="w-full h-full rounded-full object-cover"
            alt=""
          />
        ) : (
          <span className="text-purple-600 font-semibold">
            {user.username?.[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <span className="font-medium">{user.username}</span>
    </div>
  )
}

export const UsersCard = ({
  filteredUsers,
  setEditingUser,
}: {
  filteredUsers: UserProps[]
  setEditingUser: (user: UserProps) => void
}) => {

  const [selectedUser, setSelectedUser] = useState<UserProps | null>(null)
const [showDeleteModal, setShowDeleteModal] = useState(false)

console.log("Selected user ", selectedUser)

const handleDeleteUser = async (userId:string) => {
  if (!selectedUser) return
  
  try {
    // Wywołaj API do usunięcia użytkownika
    const response = await apiRequest(`/user/delete/${userId}`, {
      method: "DELETE",
    })
    console.log("response delete user ", response)

    if (response.ok) {
      toast.success("User deleted successfully")
      
    }
  } catch (error) {
    console.error("Failed to delete user:", error)
    toast.error("Failed to delete user")
  }
}

  return (
    <>
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filteredUsers.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <UserWithAvatar user={user} />
              </td>
              <td className="px-6 py-4 text-gray-600">{user.email}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.isVerified ? "Verified" : "Unverified"}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <button
                  onClick={() => setEditingUser(user)}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <Edit size={18} />
                </button>

                <button onClick={() => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {showDeleteModal && selectedUser && (
  <DeleteUserModal
    user={selectedUser}
    onClose={() => {
      setShowDeleteModal(false)
      setSelectedUser(null)
    }}
    onConfirm={() => handleDeleteUser(selectedUser._id)}
  />
)}
</>
  )
}
