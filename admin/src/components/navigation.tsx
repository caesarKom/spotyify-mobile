import { Music, Shield, Users } from "lucide-react";

interface Props {
    currentView: string
    setCurrentView: (id:string) => void
}

const Navigation = ({currentView, setCurrentView}:Props) => {

    return (
  <nav className="bg-white shadow">
    <div className="container mx-auto px-4">
      <div className="flex gap-1">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Shield },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'music', label: 'Music', icon: Music }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentView(id)}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
              currentView === id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </div>
  </nav>
);
}

export default Navigation