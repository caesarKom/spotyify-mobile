const Music = require('../models/Music');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Pobieranie wszystkich utworów (publicznych)
const getAllMusic = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, genre, artist } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Budowanie filtrów
    const filters = { isPublic: true };
    
    if (search) {
      filters.$text = { $search: search };
    }
    
    if (genre) {
      filters.genre = new RegExp(genre, 'i');
    }
    
    if (artist) {
      filters.artist = new RegExp(artist, 'i');
    }

    // Pobierz utwory z paginacją
    const music = await Music.find(filters)
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Policz całkowitą liczbę utworów
    const total = await Music.countDocuments(filters);

    res.status(200).json({
      success: true,
      music,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.log("Error get all miusic ", error)
  }
};

// Pobieranie pojedynczego utworu
const getMusicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const music = await Music.findById(id)
      .populate('uploadedBy', 'username')
      .populate('likes', 'username');

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    // Sprawdź dostęp (publiczny lub własny)
    if (!music.isPublic && music.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Brak dostępu do tego utworu'
      });
    }

    res.status(200).json({
      success: true,
      data: music
    });
  } catch (error) {
    next(error);
  }
};

// Upload nowego utworu
const uploadMusic = async (req, res) => {

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Plik jest wymagany'
      });
    }

    const { title, artist, album, genre, tags } = req.body;
    const filename = path.basename(req.file.path);
    // Walidacja wymaganych pól
    if (!title || !artist) {
      // Usuń plik jeśli walidacja nie powiedzie się
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Tytuł i artysta są wymagani'
      });
    }

    // Przygotuj tagi
    let tagArray = [];
    if (tags) {
      tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Stwórz nowy utwór
    const music = await Music.create({
      title,
      artist,
      album,
      genre,
      filePath: `${process.env.BASE_URL}/uploads/music/${filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      tags: tagArray
    });

    // Populuj dane użytkownika
    await music.populate('uploadedBy', 'username');

    res.status(201).json({
      success: true,
      message: 'Utwór został przesłany pomyślnie',
      data: music
    });
  } catch (error) {
    // Usuń plik w przypadku błędu
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.log("Error upload music ", error)
  }
};

// Upload okładki utworu
const uploadCoverImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Plik obrazu jest wymagany'
      });
    }

    // Znajdź utwór
    const music = await Music.findById(id);

    if (!music) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    // Sprawdź czy użytkownik jest właścicielem
    if (music.uploadedBy.toString() !== req.user._id.toString()) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do modyfikacji tego utworu'
      });
    }

    // Usuń starą okładkę jeśli istnieje
    if (music.coverImage) {
      const oldCoverPath = path.join(__dirname, '..', music.coverImage);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
    }
    const filename = path.basename(req.file.path);
    // Zaktualizuj okładkę
    music.coverImage = `${process.env.BASE_URL}/uploads/images/${filename}`,
    await music.save();

    res.status(200).json({
      success: true,
      message: 'Okładka została przesłana pomyślnie',
      data: {
        coverImage: music.coverImage
      }
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.log("Error upload image ", error)
  }
};

// Aktualizacja metadanych utworu
const updateMusic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artist, album, genre, tags, isPublic } = req.body;

    // Znajdź utwór
    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    // Sprawdź uprawnienia
    if (music.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do modyfikacji tego utworu'
      });
    }

    // Aktualizuj pola
    if (title) music.title = title;
    if (artist) music.artist = artist;
    if (album) music.album = album;
    if (genre) music.genre = genre;
    if (typeof isPublic === 'boolean') music.isPublic = isPublic;
    
    if (tags) {
      music.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    await music.save();
    await music.populate('uploadedBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Utwór został zaktualizowany',
      data: music
    });
  } catch (error) {
    next(error);
  }
};

// Usunięcie utworu
const deleteMusic = async (req, res, next) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    // Sprawdź uprawnienia
    if (music.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Brak uprawnień do usunięcia tego utworu'
      });
    }

    // Usuń plik z dysku
    if (music.filePath && fs.existsSync(music.filePath)) {
      fs.unlinkSync(music.filePath);
    }

    // Usuń okładkę jeśli istnieje
    if (music.coverImage && fs.existsSync(music.coverImage)) {
      fs.unlinkSync(music.coverImage);
    }

    // Usuń z bazy danych
    await Music.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Utwór został usunięty'
    });
  } catch (error) {
    next(error);
  }
};

// Polubienie utworu
const likeMusic = async (req, res, next) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    // Sprawdź czy użytkownik już polubił
    const alreadyLiked = music.likes.includes(req.user._id);

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'Już polubiłeś ten utwór'
      });
    }

    await music.like(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Utwór został polubiony',
      data: {
        likeCount: music.likeCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cofnięcie polubienia
const unlikeMusic = async (req, res, next) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    await music.unlike(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Polubienie zostało cofnięte',
      data: {
        likeCount: music.likeCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Odtworzenie utworu (zwiększenie licznika)
const playMusic = async (req, res, next) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: 'Utwór nie znaleziony'
      });
    }

    // Zwiększ licznik odtworzeń
    await music.incrementPlayCount();

    // Dodaj do ostatnio odtwarzanych użytkownika
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { 'preferences.recentlyPlayed': id } }
    );

    res.status(200).json({
      success: true,
      message: 'Utwór odtworzony',
      data: {
        playCount: music.playCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Pobieranie moich utworów
const getMyMusic = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const music = await Music.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Music.countDocuments({ uploadedBy: req.user._id });

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

module.exports = {
  getAllMusic,
  getMusicById,
  uploadMusic,
  uploadCoverImage,
  updateMusic,
  deleteMusic,
  likeMusic,
  unlikeMusic,
  playMusic,
  getMyMusic
};