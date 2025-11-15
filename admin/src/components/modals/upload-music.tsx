import { ImageIcon, Upload, X } from "lucide-react";
import { useState } from "react";

const UploadMusicModal = ({ onClose, onUpload }) => {
  const [formData, setFormData] = useState({ title: '', artist: '', album: '', genre: '', tags: '' });
  const [musicFile, setMusicFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!musicFile || !formData.title || !formData.artist) {
      alert('Please fill in required fields (file, title, artist)');
      return;
    }
    const data = new FormData();
    data.append('music', musicFile);
    data.append('title', formData.title);
    data.append('artist', formData.artist);
    if (formData.album) data.append('album', formData.album);
    if (formData.genre) data.append('genre', formData.genre);
    if (formData.tags) data.append('tags', formData.tags);
    onUpload(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upload Music</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cover Image (Optional)</label>
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
                  id="cover-upload-new"
                />
                <label
                  htmlFor="cover-upload-new"
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition"
                >
                  <Upload size={16} />
                  Choose Image
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF, WEBP (Max 10MB)</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Music File *</label>
            <input type="file" accept="audio/*" onChange={(e) => setMusicFile(e.target.files[0])} className="w-full border rounded-lg px-3 py-2" />
            {musicFile && <p className="text-xs text-green-600 mt-1">✓ {musicFile.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Artist *</label>
            <input value={formData.artist} onChange={(e) => setFormData({...formData, artist: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Album</label>
            <input value={formData.album} onChange={(e) => setFormData({...formData, album: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Genre</label>
            <input value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="pop, rock, indie" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={handleUpload} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Upload</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadMusicModal