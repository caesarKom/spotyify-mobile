// models/MediaToken.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const mediaTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => 'media_' + crypto.randomBytes(32).toString('hex')
  },
  name: {
    type: String,
    default: 'Media Access Token'
  },
  scopes: [{
    type: String,
    enum: ['media:read', 'media:stream'],
    default: ['media:read']
  }],
  limits: {
    requestsPerDay: {
      type: Number,
      default: 5000
    },
    bytesPerMonth: {
      type: Number,
      default: 5368709120 // 5GB
    }
  },
  usage: {
    requestsToday: {
      type: Number,
      default: 0
    },
    bytesThisMonth: {
      type: Number,
      default: 0
    },
    lastRequestAt: Date,
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
mediaTokenSchema.index({ token: 1 });
mediaTokenSchema.index({ user: 1 });
mediaTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Statics
mediaTokenSchema.statics.generateToken = function() {
  return 'media_' + crypto.randomBytes(32).toString('hex');
};

mediaTokenSchema.statics.createForUser = async function(userId) {
  return await this.create({
    user: userId,
    usage: {
      lastResetDate: new Date()
    }
  });
};

// Methods
mediaTokenSchema.methods.checkAndResetCounters = function() {
  const now = new Date();
  const lastRequest = this.usage.lastRequestAt || now;
  
  // Reset daily counter if new day
  if (lastRequest.toDateString() !== now.toDateString()) {
    this.usage.requestsToday = 0;
  }
  
  // Reset monthly counter if new month
  if (this.usage.lastResetDate.getMonth() !== now.getMonth()) {
    this.usage.bytesThisMonth = 0;
    this.usage.lastResetDate = now;
  }
  
  this.usage.lastRequestAt = now;
  return this;
};

mediaTokenSchema.methods.incrementUsage = async function(bytes = 0) {
  this.usage.requestsToday += 1;
  this.usage.bytesThisMonth += bytes;
  return await this.save();
};

mediaTokenSchema.methods.isWithinLimits = function() {
  return (
    this.usage.requestsToday < this.limits.requestsPerDay &&
    this.usage.bytesThisMonth < this.limits.bytesPerMonth
  );
};

mediaTokenSchema.methods.getUsageInfo = function() {
  return {
    requests: {
      today: this.usage.requestsToday,
      limit: this.limits.requestsPerDay,
      remaining: this.limits.requestsPerDay - this.usage.requestsToday
    },
    data: {
      thisMonth: this.usage.bytesThisMonth,
      limit: this.limits.bytesPerMonth,
      remaining: this.limits.bytesPerMonth - this.usage.bytesThisMonth
    },
    lastUsed: this.usage.lastRequestAt,
    expiresAt: this.expiresAt
  };
};

export default mongoose.model('MediaToken', mediaTokenSchema);