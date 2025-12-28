// middleware/mediaAuth.js
import MediaToken from '../models/MediaToken.js';

export const mediaTokenAuth = async (req, res, next) => {
  try {
    // Try different header names for flexibility
    const token = req.headers['x-media-token'] || 
                  req.headers['media-token'] ||
                  req.query.media_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Media token required'
      });
    }
    
    // Find token
    const mediaToken = await MediaToken.findOne({
      token,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).populate('user');
    
    if (!mediaToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired media token'
      });
    }
    
    // Check and reset counters
    mediaToken.checkAndResetCounters();
    
    // Check limits
    if (!mediaToken.isWithinLimits()) {
      const usage = mediaToken.getUsageInfo();
      
      if (mediaToken.usage.requestsToday >= mediaToken.limits.requestsPerDay) {
        return res.status(429).json({
          success: false,
          message: 'Daily request limit exceeded',
          limit: mediaToken.limits.requestsPerDay,
          used: mediaToken.usage.requestsToday,
          reset: 'midnight'
        });
      }
      
      if (mediaToken.usage.bytesThisMonth >= mediaToken.limits.bytesPerMonth) {
        return res.status(429).json({
          success: false,
          message: 'Monthly data limit exceeded',
          limit: mediaToken.limits.bytesPerMonth,
          used: mediaToken.usage.bytesThisMonth
        });
      }
    }
    
    // Save token state
    await mediaToken.save();
    
    // Attach to request
    req.mediaToken = mediaToken;
    req.user = { userId: mediaToken.user._id };
    
    // Set response headers for usage info
    res.set({
      'X-RateLimit-Limit': mediaToken.limits.requestsPerDay,
      'X-RateLimit-Remaining': mediaToken.limits.requestsPerDay - mediaToken.usage.requestsToday,
      'X-DataLimit-Limit': mediaToken.limits.bytesPerMonth,
      'X-DataLimit-Remaining': mediaToken.limits.bytesPerMonth - mediaToken.usage.bytesThisMonth
    });
    
    next();
  } catch (error) {
    console.error('Media token auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware tylko dla statycznych plików (bez limitów bajtów)
export const mediaTokenStaticAuth = async (req, res, next) => {
  try {
    const token = req.headers['x-media-token'] || 
                  req.query.media_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Media token required'
      });
    }
    
    const mediaToken = await MediaToken.findOne({
      token,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    if (!mediaToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid media token'
      });
    }
    
    // Dla statycznych plików tylko aktualizujemy lastRequestAt
    mediaToken.usage.lastRequestAt = new Date();
    mediaToken.usage.requestsToday += 1;
    await mediaToken.save();
    
    next();
  } catch (error) {
    console.error('Static media auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};