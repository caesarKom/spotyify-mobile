import { Music, Shield, Upload, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "../config/api";
import { Footer } from "../components/footer";

interface Stats {
  users: number
  music: number
  plays: number
  likes: number
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, music: 0, plays: 0, likes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [musicRes] = await Promise.all([
        apiRequest('/music?limit=20')
      ]);
      
      const musicData = await musicRes.json();

      setStats({
        users: 1,
        music: musicData.pagination?.totalItems || 0,
        plays: musicData.music?.reduce((sum:number, m:any) => sum + (m.playCount || 0), 0) || 0,
        likes: musicData.music?.reduce((sum:number, m:any) => sum + (m.likeCount || 0), 0) || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.users, color: 'from-blue-500 to-blue-600', icon: Users },
    { label: 'Total Music', value: stats.music, color: 'from-purple-500 to-purple-600', icon: Music },
    { label: 'Total Plays', value: stats.plays, color: 'from-green-500 to-green-600', icon: Upload },
    { label: 'Total Likes', value: stats.likes, color: 'from-pink-500 to-pink-600', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="grow flex items-center justify-center">
          <div className="text-center py-12">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="grow px-4">
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`bg-linear-to-br ${stat.color} rounded-lg p-6 text-white shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stat.value}</span>
              </div>
              <p className="text-white/90 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
        

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <p className="text-gray-600">Your dashboard content goes here...</p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard