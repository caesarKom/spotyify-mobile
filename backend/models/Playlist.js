import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Playlist name is required'],
    trim: true,
    maxlength: [100, 'The playlist name cannot exceed 100 characters.']
  },
  description: {
    type: String,
    maxlength: [500, 'The description cannot exceed 500 characters.']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music'
  }],
  coverImage: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  genres: [{                      
type: String,
trim: true,
lowercase: true
}],
}, {
  timestamps: true
});
// Indexs
playlistSchema.index({ genres: 1 });
playlistSchema.index({ owner: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ name: 'text', description: 'text' });

playlistSchema.virtual('trackCount').get(function () {
  return Array.isArray(this.tracks) ? this.tracks.length : 0;
});

playlistSchema.virtual('followerCount').get(function () {
  return Array.isArray(this.followers) ? this.followers.length : 0;
});

playlistSchema.virtual('totalDuration').get(function () {
  return 0; 
});

playlistSchema.methods.addTrack = function (musicId) {
  if (!Array.isArray(this.tracks)) this.tracks = [];
  if (!this.tracks.includes(musicId)) this.tracks.push(musicId);
  return this.save();
};

playlistSchema.methods.removeTrack = function (musicId) {
  if (!Array.isArray(this.tracks)) return Promise.resolve(this);
  this.tracks = this.tracks.filter(id => id && id.toString() !== musicId.toString());
  return this.save();
};

playlistSchema.methods.follow = function (userId) {
  if (!Array.isArray(this.followers)) this.followers = [];
  if (!this.followers.includes(userId)) this.followers.push(userId);
  return this.save();
};

playlistSchema.methods.unfollow = function (userId) {
  if (!Array.isArray(this.followers)) return Promise.resolve(this);
  this.followers = this.followers.filter(id => id && id.toString() !== userId.toString());
  return this.save();
};

playlistSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

export default mongoose.model('Playlist', playlistSchema);