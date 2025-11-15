import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "../config/api";
import EditUserModal from "../components/modals/edit-user";
import { UsersCard } from "../components/usersCard";

const UsersManagerPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/user/profile');
      const data = await res.json();
      if (data.success) {
        setUsers([data.data.user]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      alert('Error loading users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const res = await apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        alert('User updated successfully');
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading users...</div>
      ) : (
        <UsersCard filteredUsers={filteredUsers} setEditingUser={setEditingUser} />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updates) => updateUser(editingUser._id, updates)}
        />
      )}
    </div>
  );
};

export default UsersManagerPage