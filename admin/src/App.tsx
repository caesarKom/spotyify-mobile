import { AlertCircle } from 'lucide-react';
import useAuthStore from './state/storage';
import LoginPage from './pages/login-page';
import Header from './components/header';
import Navigation from './components/navigation';
import Dashboard from './pages/dashboard';
import UsersManagerPage from './pages/user-page';
import MusicManagerPage from './pages/music-page';
import { useState } from 'react';

const AdminPanel = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
const [currentView, setCurrentView] = useState('dashboard');
  // Check if user is admin
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // if (user && user.role !== 'admin') {
  //   return (
  //     <div className="min-h-screen bg-linear-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
  //       <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center">
  //         <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
  //         <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
  //         <p className="text-red-200 mb-6">You don't have admin privileges to access this panel.</p>
  //         <button
  //           onClick={logout}
  //           className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition"
  //         >
  //           Logout
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'users' && <UsersManagerPage />}
        {currentView === 'music' && <MusicManagerPage />}
      </main>
    </div>
  );
};

export default AdminPanel;
