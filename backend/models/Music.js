import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true,
    maxlength: [100, 'The title cannot exceed 100 characters.']
  },
  artist: {
    type: String,
    required: [true, 'Artist is required'],
    trim: true,
    maxlength: [100, 'Artist name cannot exceed 100 characters']
  },
  album: {
    type: String,
    trim: true,
    maxlength: [100, 'Album name cannot exceed 100 characters']
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters']
  },
  duration: {
    type: Number, // w sekundach
    min: [1, 'Duration must be greater than 0']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
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

// Indexes for search
musicSchema.index({ title: 'text', artist: 'text', album: 'text' });
musicSchema.index({ genre: 1 });
musicSchema.index({ uploadedBy: 1 });
musicSchema.index({ isPublic: 1 });

// Method to increase play count
musicSchema.methods.incrementPlayCount = function() {
  this.playCount += 1;
  return this.save();
};

musicSchema.methods.like = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

musicSchema.methods.unlike = function(userId) {
  this.likes = this.likes.filter(id => !id.equals(userId));
  return this.save();
};

// Virtual field for formatted duration
musicSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual field for the number of likes
musicSchema.virtual('likeCount').get(function() {
  return this.likes?.length;
});

// Serialization configuration
musicSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

export default mongoose.model('Music', musicSchema);