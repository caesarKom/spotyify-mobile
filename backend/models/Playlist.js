const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nazwa playlisty jest wymagana'],
    trim: true,
    maxlength: [100, 'Nazwa playlisty nie może przekraczać 100 znaków']
  },
  description: {
    type: String,
    maxlength: [500, 'Opis nie może przekraczać 500 znaków']
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

// Indeksy
playlistSchema.index({ owner: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ name: 'text', description: 'text' });

// Wirtualne pole dla liczby utworów
playlistSchema.virtual('trackCount').get(function() {
  return this.tracks.length;
});

// Wirtualne pole dla liczby obserwujących
playlistSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Wirtualne pole dla całkowitego czasu trwania
playlistSchema.virtual('totalDuration').get(function() {
  // To będzie obliczane dynamicznie przy pobieraniu playlisty
  return 0;
});

// Metoda do dodawania utworów
playlistSchema.methods.addTrack = function(musicId) {
  if (!this.tracks.includes(musicId)) {
    this.tracks.push(musicId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Metoda do usuwania utworów
playlistSchema.methods.removeTrack = function(musicId) {
  this.tracks = this.tracks.filter(id => !id.equals(musicId));
  return this.save();
};

// Metoda do obserwowania playlisty
playlistSchema.methods.follow = function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Metoda do przestania obserwowania
playlistSchema.methods.unfollow = function(userId) {
  this.followers = this.followers.filter(id => !id.equals(userId));
  return this.save();
};

// Konfiguracja serializacji
playlistSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Playlist', playlistSchema);