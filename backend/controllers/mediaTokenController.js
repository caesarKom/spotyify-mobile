// controllers/mediaTokenController.js
import MediaToken from '../models/MediaToken.js';
import User from '../models/User.js';

export const getMyMediaToken = async (req, res) => {
  const { userId } = req.params.id
  try {
    const user = await User.findById(userId)
      .populate('mediaToken');
    
    if (!user.mediaToken) {
      return res.status(404).json({
        success: false,
        message: 'No media token found. Create one first.'
      });
    }
    
    const usageInfo = user.mediaToken.getUsageInfo();
    
    res.json({
      success: true,
      data: {
        token: user.mediaToken.token,
        name: user.mediaToken.name,
        scopes: user.mediaToken.scopes,
        createdAt: user.mediaToken.createdAt,
        expiresAt: user.mediaToken.expiresAt,
        isActive: user.mediaToken.isActive,
        usage: usageInfo
      }
    });
  } catch (error) {
    console.error('Get media token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createMediaToken = async (req, res) => {
  console.log("start create media token")
  const { userId } = req.params.id
  console.log(" user id params ", userId)
  try {
    const user = await User.findById(userId);
    console.log("fetch user from mongo db ", user)
    // Sprawdź czy użytkownik może mieć token (np. tylko zweryfikowani)
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account must be verified to create media token'
      });
    }
    
    console.log("start create media token ")
    const mediaToken = await user.createMediaToken();
    console.log("Media token create ", mediaToken)
    res.status(201).json({
      success: true,
      message: 'Media token created successfully',
      data: {
        token: mediaToken.token,
        createdAt: mediaToken.createdAt,
        expiresAt: mediaToken.expiresAt
      }
    });
  } catch (error) {
    console.error('Create media token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const regenerateMediaToken = async (req, res) => {
  const { userId } = req.params.id
  try {
    const user = await User.findById(userId);
    
    // Sprawdź czy istnieje stary token
    if (!user.mediaToken) {
      return createMediaToken(req, res);
    }
    
    // Deaktywuj stary token
    await MediaToken.findByIdAndUpdate(user.mediaToken, {
      isActive: false,
      deactivatedAt: new Date()
    });
    
    // Utwórz nowy token
    const newToken = await user.createMediaToken();
    
    res.json({
      success: true,
      message: 'Media token regenerated successfully',
      data: {
        token: newToken.token,
        createdAt: newToken.createdAt,
        oldTokenDeactivated: true
      }
    });
  } catch (error) {
    console.error('Regenerate media token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateMediaToken = async (req, res) => {
  const { userId } = req.params.id
  try {
    const { name, scopes, requestsPerDay, bytesPerMonth } = req.body;
    const user = await User.findById(userId);
    
    if (!user.mediaToken) {
      return res.status(404).json({
        success: false,
        message: 'No media token found'
      });
    }
    
    const updates = {};
    if (name) updates.name = name;
    if (scopes && Array.isArray(scopes)) updates.scopes = scopes;
    if (requestsPerDay) updates['limits.requestsPerDay'] = requestsPerDay;
    if (bytesPerMonth) updates['limits.bytesPerMonth'] = bytesPerMonth;
    
    const updatedToken = await MediaToken.findByIdAndUpdate(
      user.mediaToken,
      updates,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Media token updated successfully',
      data: {
        name: updatedToken.name,
        scopes: updatedToken.scopes,
        limits: updatedToken.limits,
        updatedAt: updatedToken.updatedAt
      }
    });
  } catch (error) {
    console.error('Update media token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deactivateMediaToken = async (req, res) => {
  const { userId } = req.params.id
  try {
    const user = await User.findById(userId);
    
    if (!user.mediaToken) {
      return res.status(404).json({
        success: false,
        message: 'No active media token found'
      });
    }
    
    await MediaToken.findByIdAndUpdate(user.mediaToken, {
      isActive: false,
      deactivatedAt: new Date()
    });
    
    user.mediaToken = null;
    await user.save();
    
    res.json({
      success: true,
      message: 'Media token deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate media token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};