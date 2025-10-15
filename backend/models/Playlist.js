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
  }]
}, {
  timestamps: true
});
// Indexs
playlistSchema.index({ owner: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ name: 'text', description: 'text' });

// Virtual field for the number of tracks
playlistSchema.virtual('trackCount').get(function() {
  return this.tracks.length;
});

// Virtual field for follower count
playlistSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual field for total duration
playlistSchema.virtual('totalDuration').get(function() {
  // This will be calculated dynamically when downloading the playlist
  return 0;
});

// Method for adding songs
playlistSchema.methods.addTrack = function(musicId) {
  if (!this.tracks.includes(musicId)) {
    this.tracks.push(musicId);
    return this.save();
  }
  return Promise.resolve(this);
};

playlistSchema.methods.removeTrack = function(musicId) {
  this.tracks = this.tracks.filter(id => !id.equals(musicId));
  return this.save();
};

// Method to follow a playlist
playlistSchema.methods.follow = function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

playlistSchema.methods.unfollow = function(userId) {
  this.followers = this.followers.filter(id => !id.equals(userId));
  return this.save();
};

playlistSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

export default mongoose.model('Playlist', playlistSchema);