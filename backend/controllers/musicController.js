// import Music from "../models/Music.js"
// import User from "../models/User.js"
// import path from "path"
// import fs from "fs"
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Get all songs (public)
// export const getAllMusic = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, search, genre, artist, fields } = req.query;
//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, parseInt(limit));
//     const skip = (pageNum - 1) * limitNum;

//     const filters = { isPublic: true };

//     if (search) filters.$text = { $search: search };
//     if (genre) filters.genre = new RegExp(genre, 'i');
//     if (artist) filters.artist = new RegExp(artist, 'i');

//     const music = await Music.find(filters)
//       //.populate('uploadedBy', 'username')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limitNum);

//     const total = await Music.countDocuments(filters);

//     res.status(200).json({
//       success: true,
//       music,
//       pagination: {
//         currentPage: pageNum,
//         totalPages: Math.ceil(total / limitNum),
//         totalItems: total,
//         itemsPerPage: limitNum,
//       },
//     });
//   } catch (error) {
//     console.error('getAllMusic error:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };

// export const getMusicById = async (req, res) => {
//   try {
//     const { id } = req.params

//     const music = await Music.findById(id)
//       .populate("uploadedBy", "username")
//       .populate("likes", "username")

//     if (!music) {
//       return res.status(404).json({
//         success: false,
//         message: "Song not found.",
//       })
//     }

//     // Check access (public or private)
//     if (
//       !music.isPublic &&
//       music.uploadedBy._id.toString() !== req.user.userId.toString()
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "No access to this track",
//       })
//     }

//     res.status(200).json({
//       success: true,
//       data: music,
//     })
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// export const uploadMusic = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "File is required",
//       })
//     }

//     const { title, artist, album, genre, tags } = await req.body

//     const fileName = path.basename(req.file.path)

//     if (!title || !artist) {
//       // Delete file if validation fails
//       fs.unlinkSync(req.file.path)
//       return res.status(400).json({
//         success: false,
//         message: "Title and artist are required",
//       })
//     }

//     // Prepare tags
//     let tagArray = []
//     if (tags) {
//       tagArray = tags
//         .split(",")
//         .map((tag) => tag.trim())
//         .filter((tag) => tag)
//     }

//     const music = await Music.create({
//       title,
//       artist,
//       album,
//       genre,
//       filePath: `${process.env.BASE_URL}/uploads/music/${fileName}`,
//       fileSize: req.file.size,
//       mimeType: req.file.mimetype,
//       uploadedBy: req.user.userId,
//       tags: tagArray,
//     })

//     await music.populate("uploadedBy", "username")

//     res.status(201).json({
//       success: true,
//       message: "The song was uploaded successfully",
//       data: music,
//     })
//   } catch (error) {
//     console.log("Error upload music ", error)
//     if (req.file) {
//       fs.unlinkSync(req.file.path)
//     }
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// export const uploadCoverImage = async (req, res) => {
//   try {
//     const { id } = req.params

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Image file is required",
//       })
//     }

//     const music = await Music.findById(id)

//     if (!music) {
//       fs.unlinkSync(req.file.path)
//       return res.status(404).json({
//         success: false,
//         message: "Song not found.",
//       })
//     }

//     if (music.uploadedBy.toString() !== req.user.userId.toString()) {
//       fs.unlinkSync(req.file.path)
//       return res.status(403).json({
//         success: false,
//         message: "You do not have permission to modify this track.",
//       })
//     }

//     if (music.coverImage) {
//       const oldCoverPath = path.join(__dirname, "..", music.coverImage)
//       if (fs.existsSync(oldCoverPath)) {
//         fs.unlinkSync(oldCoverPath)
//       }
//     }
//     const fileName = path.basename(req.file.path)

//     music.coverImage = `${process.env.BASE_URL}/uploads/images/${fileName}`
//       await music.save()

//     res.status(200).json({
//       success: true,
//       message: "✅ The cover has been uploaded successfully",
//       data: {
//         coverImage: music.coverImage,
//       },
//     })
//   } catch (error) {
//     if (req.file) fs.unlinkSync(req.file.path)
//     console.log("Error upload image ", error)
//     return res.status(500).json({
//       success: false,
//       message: "Server error while uploading",
//     })
//   }
// }

// export const updateMusic = async (req, res) => {
//   try {
//     const { id } = req.params
//     const { title, artist, album, genre, tags, isPublic } = req.body

//     const music = await Music.findById(id)

//     if (!music) {
//       return res.status(404).json({
//         success: false,
//         message: "Song not found.",
//       })
//     }

//     if (req.user.role !== "admin" && music.uploadedBy.toString() !== req.user.userId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not have permission to modify this track.",
//       })
//     }

//     if (title) music.title = title
//     if (artist) music.artist = artist
//     if (album) music.album = album
//     if (genre) music.genre = genre
//     if (typeof isPublic === "boolean") music.isPublic = isPublic

//     if (tags) {
//       music.tags = tags
//         .split(",")
//         .map((tag) => tag.trim())
//         .filter((tag) => tag)
//     }

//     await music.save()
//     await music.populate("uploadedBy", "username")

//     res.status(200).json({
//       success: true,
//       message: "The song has been updated",
//       data: music,
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// export const deleteMusic = async (req, res) => {
//   try {
//     const { id } = req.params

//     const music = await Music.findById(id)

//     if (!music) {
//       return res.status(404).json({
//         success: false,
//         message: "Song not found.",
//       })
//     }
//     const isAdmin = req.user.role === "admin"
//     const isOwner = music.uploadedBy.toString() === req.user.userId.toString()

//     if (!isAdmin && !isOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not have permission to delete this song",
//       })
//     }

//     if (music.coverImage) {
//       const relativePath = music.coverImage.replace(process.env.BASE_URL, '').replace(/^\//, '')
//       const fullPath = path.join(__dirname, "..", relativePath)
//       if (fs.existsSync(fullPath)) {
//         fs.unlinkSync(fullPath)
//       }
//     }
//     if (music.filePath) {
//       const relativePath = music.filePath.replace(process.env.BASE_URL, '').replace(/^\//, '')
//       const fullPath = path.join(__dirname, "..", relativePath)
//       if (fs.existsSync(fullPath)) {
//         fs.unlinkSync(fullPath)
//       }
//     }

//     await Music.findByIdAndDelete(id)

//     res.status(200).json({
//       success: true,
//       message: "The song has been removed",
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// export const likeMusic = async (req, res) => {
//   try {
//     const { id } = req.params

//     const music = await Music.findById(id)

//     if (!music) {
//       return res.status(404).json({
//         success: false,
//         message: "Song not found.",
//       })
//     }

//     const alreadyLiked = music.likes.includes(req.user.userId)

//     if (alreadyLiked) {
//       return res.status(400).json({
//         success: false,
//         message: "You already liked this song",
//       })
//     }

//     await music.like(req.user.userId)

//     res.status(200).json({
//       success: true,
//       message: "The song has been liked",
//       likeCount: music.likeCount,
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// export const unlikeMusic = async (req, res) => {
//   try {
//     const { id } = req.params

//     const music = await Music.findById(id)

//     if (!music) {
//       return res.status(404).json({
//         success: false,
//         message: "Song not found",
//       })
//     }

//     await music.unlike(req.user.userId)

//     res.status(200).json({
//       success: true,
//       message: "The like was revoked",

//         likeCount: music.likeCount,

//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// // Play song (increase counter)
// export const playMusic = async (req, res) => {
//   try {
//     const { id } = req.params

//     const music = await Music.findById(id)

//     if (!music) {
//       return res.status(404).json({
//         success: false,
//         message: "Song not found.",
//       })
//     }

//     await music.incrementPlayCount()

//     // Add to user's recently played list
//     await User.findByIdAndUpdate(req.user.userId, {
//       $addToSet: { "preferences.recentlyPlayed": id },
//     })

//     res.status(200).json({
//       success: true,
//       message: "The song was played",
//       playCount: music.playCount,
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

// // Get my songs
// export const getMyMusic = async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query
//     const pageNum = parseInt(page)
//     const limitNum = parseInt(limit)
//     const skip = (pageNum - 1) * limitNum

//     const music = await Music.find({ uploadedBy: req.user.userId })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limitNum)

//     const total = await Music.countDocuments({ uploadedBy: req.user.userId })

//     res.status(200).json({
//       success: true,
//       data: music,
//       pagination: {
//         currentPage: pageNum,
//         totalPages: Math.ceil(total / limitNum),
//         totalItems: total,
//         itemsPerPage: limitNum,
//       },
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     })
//   }
// }

import Music from "../models/Music.js"
import User from "../models/User.js"
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Generowanie unikalnej nazwy pliku z hashem
const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  return `${timestamp}-${hash}${ext}`;
};

// Helper: Sprawdzenie czy plik istnieje w systemie
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Helper: Bezpieczne usuwanie pliku
const safeUnlink = (filePath) => {
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
  return false;
};

// Helper: Konwersja URL na lokalną ścieżkę
const urlToLocalPath = (fileUrl) => {
  if (!fileUrl) return null;
  const relativePath = fileUrl.replace(process.env.BASE_URL, '').replace(/^\//, '');
  return path.join(__dirname, "..", relativePath);
};

// Get all songs (public)
export const getAllMusic = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, genre, artist, fields } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filters = { isPublic: true };

    if (search) filters.$text = { $search: search };
    if (genre) filters.genre = new RegExp(genre, 'i');
    if (artist) filters.artist = new RegExp(artist, 'i');

    const music = await Music.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Music.countDocuments(filters);

    res.status(200).json({
      success: true,
      music,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('getAllMusic error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMusicById = async (req, res) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id)
      .populate("uploadedBy", "username")
      .populate("likes", "username");

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    // FIX: Sprawdzenie czy req.user istnieje przed porównaniem
    const isOwner = req.user && music.uploadedBy._id.toString() === req.user.userId.toString();
    
    if (!music.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "No access to this track",
      });
    }

    res.status(200).json({
      success: true,
      data: music,
    });
  } catch (err) {
    console.error('getMusicById error:', err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadMusic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    // Walidacja typu pliku audio
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp3'];
    if (!allowedAudioTypes.includes(req.file.mimetype)) {
      safeUnlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Allowed: MP3, WAV, OGG, FLAC",
      });
    }

    const { title, artist, album, genre, tags } = req.body;

    if (!title || !artist) {
      safeUnlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Title and artist are required",
      });
    }

    // 🔍 SPRAWDZENIE: Czy plik o tej samej nazwie już istnieje w systemie?
    if (fileExists(req.file.path)) {
      // Plik został już zapisany przez multer, sprawdź czy nie jest duplikatem
      const stats = fs.statSync(req.file.path);
      const existingMusic = await Music.findOne({
        fileSize: stats.size,
        mimeType: req.file.mimetype,
        // Opcjonalnie: sprawdzenie hash'a pliku dla pewności
      });

      if (existingMusic) {
        safeUnlink(req.file.path);
        return res.status(409).json({
          success: false,
          message: "This file already exists in the system",
          existingTrack: {
            id: existingMusic._id,
            title: existingMusic.title,
            artist: existingMusic.artist,
          },
        });
      }
    }

    // Generowanie unikalnej nazwy pliku jeśli potrzeba
    const originalFileName = path.basename(req.file.path);
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const newPath = path.join(path.dirname(req.file.path), uniqueFileName);

    // Sprawdzenie czy docelowa ścieżka nie jest zajęta
    if (fileExists(newPath)) {
      safeUnlink(req.file.path);
      return res.status(409).json({
        success: false,
        message: "File conflict detected. Please try again.",
      });
    }

    // Rename na unikalną nazwę
    try {
      fs.renameSync(req.file.path, newPath);
    } catch (error) {
      safeUnlink(req.file.path);
      throw error;
    }

    // Prepare tags
    let tagArray = [];
    if (tags) {
      tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    }

    const music = await Music.create({
      title,
      artist,
      album,
      genre,
      filePath: `${process.env.BASE_URL}/uploads/music/${uniqueFileName}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
      tags: tagArray,
    });

    await music.populate("uploadedBy", "username");

    res.status(201).json({
      success: true,
      message: "The song was uploaded successfully",
      data: music,
    });
  } catch (error) {
    console.error("Error upload music:", error);
    safeUnlink(req.file?.path);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadCoverImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Walidacja typu obrazu
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      safeUnlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Invalid image type. Allowed: JPEG, PNG, WebP, GIF",
      });
    }

    const music = await Music.findById(id);

    if (!music) {
      safeUnlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    if (music.uploadedBy.toString() !== req.user.userId.toString()) {
      safeUnlink(req.file.path);
      return res.status(403).json({
        success: false,
        message: "You do not have permission to modify this track.",
      });
    }

    // 🔍 SPRAWDZENIE: Czy nowy obraz nie jest identyczny z obecnym?
    const newImageStats = fs.statSync(req.file.path);
    const currentCoverPath = urlToLocalPath(music.coverImage);
    
    if (currentCoverPath && fileExists(currentCoverPath)) {
      const currentStats = fs.statSync(currentCoverPath);
      
      // Jeśli rozmiar jest identyczny, porównaj hash (opcjonalnie)
      if (currentStats.size === newImageStats.size) {
        // Możesz dodać tutaj porównanie hashy jeśli potrzebujesz 100% pewności
        safeUnlink(req.file.path);
        return res.status(409).json({
          success: false,
          message: "This image is already set as cover for this track",
        });
      }

      // Usuń starą okładkę
      safeUnlink(currentCoverPath);
    }

    // Generowanie unikalnej nazwy dla obrazu
    const originalFileName = path.basename(req.file.path);
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const newPath = path.join(path.dirname(req.file.path), uniqueFileName);

    // Sprawdzenie czy docelowa ścieżka nie jest zajęta
    if (fileExists(newPath)) {
      safeUnlink(req.file.path);
      return res.status(409).json({
        success: false,
        message: "File name conflict. Please try again.",
      });
    }

    // Rename na unikalną nazwę
    try {
      fs.renameSync(req.file.path, newPath);
    } catch (error) {
      safeUnlink(req.file.path);
      throw error;
    }

    music.coverImage = `${process.env.BASE_URL}/uploads/images/${uniqueFileName}`;
    await music.save();

    res.status(200).json({
      success: true,
      message: "✅ The cover has been uploaded successfully",
      data: {
        coverImage: music.coverImage,
      },
    });
  } catch (error) {
    safeUnlink(req.file?.path);
    console.error("Error upload image:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading",
    });
  }
};

export const updateMusic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, album, genre, tags, isPublic } = req.body;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    if (req.user.role !== "admin" && music.uploadedBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to modify this track.",
      });
    }

    if (title) music.title = title;
    if (artist) music.artist = artist;
    if (album) music.album = album;
    if (genre) music.genre = genre;
    if (typeof isPublic === "boolean") music.isPublic = isPublic;

    if (tags) {
      music.tags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    }

    await music.save();
    await music.populate("uploadedBy", "username");

    res.status(200).json({
      success: true,
      message: "The song has been updated",
      data: music,
    });
  } catch (error) {
    console.error('updateMusic error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteMusic = async (req, res) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }
    
    const isAdmin = req.user.role === "admin";
    const isOwner = music.uploadedBy.toString() === req.user.userId.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this song",
      });
    }

    // Usuwanie powiązanych plików z użyciem helperów
    const coverPath = urlToLocalPath(music.coverImage);
    const filePath = urlToLocalPath(music.filePath);

    if (coverPath) safeUnlink(coverPath);
    if (filePath) safeUnlink(filePath);

    await Music.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "The song has been removed",
    });
  } catch (error) {
    console.error('deleteMusic error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const likeMusic = async (req, res) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    const alreadyLiked = music.likes.includes(req.user.userId);

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: "You already liked this song",
      });
    }

    await music.like(req.user.userId);

    res.status(200).json({
      success: true,
      message: "The song has been liked",
      likeCount: music.likeCount,
    });
  } catch (error) {
    console.error('likeMusic error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const unlikeMusic = async (req, res) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    await music.unlike(req.user.userId);

    res.status(200).json({
      success: true,
      message: "The like was revoked",
      likeCount: music.likeCount,
    });
  } catch (error) {
    console.error('unlikeMusic error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Play song (increase counter)
export const playMusic = async (req, res) => {
  try {
    const { id } = req.params;

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      });
    }

    await music.incrementPlayCount();

    // Add to user's recently played list
    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { "preferences.recentlyPlayed": id },
    });

    res.status(200).json({
      success: true,
      message: "The song was played",
      playCount: music.playCount,
    });
  } catch (error) {
    console.error('playMusic error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get my songs
export const getMyMusic = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const music = await Music.find({ uploadedBy: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Music.countDocuments({ uploadedBy: req.user.userId });

    res.status(200).json({
      success: true,
      data: music,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('getMyMusic error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};