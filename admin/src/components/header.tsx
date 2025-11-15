import { LogOut, Music } from "lucide-react"
import useAuthStore from "../state/storage"

const Header = () => {
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Spotify Clone Admin</h1>
            <p className="text-sm text-purple-200">Secure Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">{user?.username || "Admin"}</p>
            <p className="text-sm text-purple-200">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
