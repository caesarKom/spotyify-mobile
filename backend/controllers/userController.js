const User = require('../models/User');
const Music = require('../models/Music');
const path = require('path');
const fs = require('fs');

// Pobieranie profilu użytkownika
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('preferences.recentlyPlayed', 'title artist coverImage')
      .populate('preferences.playlists', 'name description coverImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Policz statystyki
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
    next(error);
  }
};

// Aktualizacja profilu użytkownika
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio, favoriteGenres } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Aktualizuj pola profilu
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    
    // Aktualizuj ulubione gatunki
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
      message: 'Profil zaktualizowany pomyślnie',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Upload awatara użytkownika
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Plik obrazu jest wymagany'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Usuń stary avatar jeśli istnieje
    if (user.profile.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', user.profile.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Zaktualizuj avatar
    user.profile.avatar = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar został przesłany pomyślnie',
      data: {
        avatar: user.profile.avatar
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Usunięcie awatara
const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    if (!user.profile.avatar) {
      return res.status(400).json({
        success: false,
        message: 'Nie masz ustawionego awatara'
      });
    }

    // Usuń plik awatara
    const avatarPath = path.join(__dirname, '..', user.profile.avatar);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // Wyczyść pole avatar
    user.profile.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar został usunięty'
    });
  } catch (error) {
    next(error);
  }
};

// Pobieranie ulubionych utworów użytkownika
const getLikedMusic = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const music = await Music.find({ likes: req.user._id })
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Music.countDocuments({ likes: req.user._id });

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
    next(error);
  }
};

// Pobieranie ostatnio odtwarzanych utworów
const getRecentlyPlayed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
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
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Ogranicz do 20 ostatnich
    const recentlyPlayed = user.preferences.recentlyPlayed.slice(0, 20);

    res.status(200).json({
      success: true,
      data: recentlyPlayed
    });
  } catch (error) {
    next(error);
  }
};

// Zmiana hasła użytkownika
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Aktualne hasło i nowe hasło są wymagane'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nowe hasło musi mieć minimum 6 znaków'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Sprawdź aktualne hasło
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Aktualne hasło jest nieprawidłowe'
      });
    }

    // Zaktualizuj hasło
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Hasło zostało zmienione pomyślnie'
    });
  } catch (error) {
    next(error);
  }
};

// Usunięcie konta użytkownika
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Hasło jest wymagane do usunięcia konta'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Użytkownik nie znaleziony'
      });
    }

    // Sprawdź hasło
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe hasło'
      });
    }

    // Usuń wszystkie pliki użytkownika
    const userMusic = await Music.find({ uploadedBy: user._id });
    
    for (const music of userMusic) {
      // Usuń plik audio
      if (music.filePath && fs.existsSync(music.filePath)) {
        fs.unlinkSync(music.filePath);
      }
      
      // Usuń okładkę
      if (music.coverImage && fs.existsSync(music.coverImage)) {
        fs.unlinkSync(music.coverImage);
      }
    }

    // Usuń awatara jeśli istnieje
    if (user.profile.avatar) {
      const avatarPath = path.join(__dirname, '..', user.profile.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Usuń wszystkie utwory użytkownika
    await Music.deleteMany({ uploadedBy: user._id });

    // Usuń użytkownika
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'Konto zostało usunięte pomyślnie'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getLikedMusic,
  getRecentlyPlayed,
  changePassword,
  deleteAccount
};