import { ImageIcon, Upload, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "../../config/api";
import { useAuthImage } from "../../hooks/useAuthImage";


const EditUserModal = ({ user, onClose, onSave }) => {
  const avatarUrl = useAuthImage(user.profile.avatar)
  const [formData, setFormData] = useState({
    role: user?.role || '',
    firstName: user.profile?.firstName || '',
    lastName: user.profile?.lastName || '',
    bio: user.profile?.bio || '',
    favoriteGenres: user.preferences?.favoriteGenres?.join(', ') || ''
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl || null);
console.log(user)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
      // First update the music data
      await onSave(formData);
      
      // Then upload cover image if selected
      if (avatar) {
        const formData = new FormData();
        formData.append('image', avatar);
        
        try {
          const res = await apiRequest(`/user/avatar`, {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            alert('Avatar image updated successfully');
          }
        } catch (err:any) {
          alert('Error uploading avatar: ' + err.message);
        }
      }
    };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit User: {user.username}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>


        <div>
            <label className="block text-sm font-medium mb-2">Avatar Image</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-linear-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
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
                <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF, WEBP (Max 10MB)</p>
              </div>
            </div>
          </div>




        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input 
              value={formData.firstName} 
              onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
              className="w-full border rounded-lg px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input 
              value={formData.lastName} 
              onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
              className="w-full border rounded-lg px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea 
              value={formData.bio} 
              onChange={(e) => setFormData({...formData, bio: e.target.value})} 
              className="w-full border rounded-lg px-3 py-2 h-24" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Favorite Genres (comma separated)</label>
            <input 
              value={formData.favoriteGenres} 
              onChange={(e) => setFormData({...formData, favoriteGenres: e.target.value})} 
              placeholder="rock, pop, jazz"
              className="w-full border rounded-lg px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User Role</label>
            <input 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})} 
              placeholder="user | admin"
              className="w-full border rounded-lg px-3 py-2" 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleSave} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal