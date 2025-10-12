const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tytuł utworu jest wymagany'],
    trim: true,
    maxlength: [100, 'Tytuł nie może przekraczać 100 znaków']
  },
  artist: {
    type: String,
    required: [true, 'Artysta jest wymagany'],
    trim: true,
    maxlength: [100, 'Nazwa artysty nie może przekraczać 100 znaków']
  },
  album: {
    type: String,
    trim: true,
    maxlength: [100, 'Nazwa albumu nie może przekraczać 100 znaków']
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Gatunek nie może przekraczać 50 znaków']
  },
  duration: {
    type: Number, // w sekundach
    min: [1, 'Czas trwania musi być większy niż 0']
  },
  filePath: {
    type: String,
    required: [true, 'Ścieżka do pliku jest wymagana']
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  playCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    bitrate: Number,
    sampleRate: Number,
    channels: Number,
    format: String
  }
}, {
  timestamps: true
});

// Indeksy dla wyszukiwania
musicSchema.index({ title: 'text', artist: 'text', album: 'text' });
musicSchema.index({ genre: 1 });
musicSchema.index({ uploadedBy: 1 });
musicSchema.index({ isPublic: 1 });

// Metoda do zwiększania licznika odtworzeń
musicSchema.methods.incrementPlayCount = function() {
  this.playCount += 1;
  return this.save();
};

// Metoda do polubienia utworu
musicSchema.methods.like = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Metoda do cofnięcia polubienia
musicSchema.methods.unlike = function(userId) {
  this.likes = this.likes.filter(id => !id.equals(userId));
  return this.save();
};

// Wirtualne pole dla formatowanego czasu trwania
musicSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Wirtualne pole dla liczby polubień
musicSchema.virtual('likeCount').get(function() {
  return this.likes?.length;
});

// Konfiguracja serializacji
musicSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Music', musicSchema);