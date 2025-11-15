import User from '../models/User.js';
import Music from '../models/Music.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getProfile = async (req, res) => {

  try {
    const user = await User.findById(req.user.userId)
      .populate('preferences.recentlyPlayed', 'title artist coverImage')
     //.populate('preferences.playlists', 'name description coverImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const musicCount = await Music.countDocuments({ uploadedBy: user._id });
    const likedCount = await Music.countDocuments({ likes: user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          musicCount,
          likedCount
        }
      }
    });
  } catch (error) {
    console.log("Error get profile ", error)
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, favoriteGenres } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Update profile fields
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    
    // Update your favorite genres
    if (favoriteGenres) {
      if (Array.isArray(favoriteGenres)) {
        user.preferences.favoriteGenres = favoriteGenres;
      } else if (typeof favoriteGenres === 'string') {
        user.preferences.favoriteGenres = favoriteGenres.split(',').map(g => g.trim()).filter(g => g);
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Delete the old avatar if it exists
    if (user.profile.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', user.profile.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    } 
    const fileName = path.basename(req.file.path)
    user.profile.avatar = `${process.env.BASE_URL}/uploads/images/${fileName}`
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.profile.avatar
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
     res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profile.avatar) {
      return res.status(400).json({
        success: false,
        message: 'You dont have an avatar set'
      });
    }

    const avatarPath = path.join(__dirname, '..', user.profile.avatar);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    user.profile.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar has been removed'
    });
  } catch (error) {
     res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

const getLikedMusic = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const music = await Music.find({ likes: req.user.userId })
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Music.countDocuments({ likes: req.user.userId });

    res.status(200).json({
      success: true,
      data: music,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

const getRecentlyPlayed = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate({
        path: 'preferences.recentlyPlayed',
        populate: {
          path: 'uploadedBy',
          select: 'username'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Limit to last 20
    const recentlyPlayed = user.preferences.recentlyPlayed.slice(0, 20);

    res.status(200).json({
      success: true,
      data: recentlyPlayed
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'The new password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'The current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'The password has been changed successfully'
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'A password is required to delete your account.'
      });
    }

    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    const userMusic = await Music.find({ uploadedBy: user._id });
    
    for (const music of userMusic) {
      if (music.filePath && fs.existsSync(music.filePath)) {
        fs.unlinkSync(music.filePath);
      }
      
      if (music.coverImage && fs.existsSync(music.coverImage)) {
        fs.unlinkSync(music.coverImage);
      }
    }

    if (user.profile.avatar) {
      const avatarPath = path.join(__dirname, '..', user.profile.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await Music.deleteMany({ uploadedBy: user._id });

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'The account was deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
  }
};

export {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getLikedMusic,
  getRecentlyPlayed,
  changePassword,
  deleteAccount
};