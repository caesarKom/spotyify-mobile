import { Music } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
 <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Music className="w-8 h-8" />
      <div>
        <h2 className="text-xl font-bold">Spotify Clone Admin</h2>
        <p className="text-sm text-purple-200">Secure Management System © {new Date().getFullYear()}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="text-sm font-medium">Version 1.0.0</p>
        <p className="text-xs text-purple-200">Last updated: {new Date().getDate()-3}.{new Date().getMonth()}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-purple-200 hover:text-white transition">
          Help
        </button>
        <button className="text-purple-200 hover:text-white transition">
          Docs
        </button>
        <button className="text-purple-200 hover:text-white transition">
          Privacy
        </button>
      </div>
    </div>
  </div>
</footer>
  )
}