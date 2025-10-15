import Music from "../models/Music.js"
import User from "../models/User.js"
import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all songs (public)
export const getAllMusic = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, genre, artist } = req.query
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const filters = { isPublic: true }

    if (search) {
      filters.$text = { $search: search }
    }

    if (genre) {
      filters.genre = new RegExp(genre, "i")
    }

    if (artist) {
      filters.artist = new RegExp(artist, "i")
    }

    // Download songs with pagination
    const music = await Music.find(filters)
      .populate("uploadedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Calculate the total number of songs
    const total = await Music.countDocuments(filters)

    res.status(200).json({
      success: true,
      music,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    })
  } catch (error) {
    console.log("Error get all miusic ", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const getMusicById = async (req, res) => {
  try {
    const { id } = req.params

    const music = await Music.findById(id)
      .populate("uploadedBy", "username")
      .populate("likes", "username")

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      })
    }

    // Check access (public or private)
    if (
      !music.isPublic &&
      music.uploadedBy._id.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "No access to this track",
      })
    }

    res.status(200).json({
      success: true,
      data: music,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const uploadMusic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      })
    }

    const { title, artist, album, genre, tags } = await req.body

    const fileName = path.basename(req.file.path)

    if (!title || !artist) {
      // Delete file if validation fails
      fs.unlinkSync(req.file.path)
      return res.status(400).json({
        success: false,
        message: "Title and artist are required",
      })
    }

    // Prepare tags
    let tagArray = []
    if (tags) {
      tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    }

    const music = await Music.create({
      title,
      artist,
      album,
      genre,
      filePath: `${process.env.BASE_URL}/uploads/music/${fileName}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.userId,
      tags: tagArray,
    })

    await music.populate("uploadedBy", "username")

    res.status(201).json({
      success: true,
      message: "The song was uploaded successfully",
      data: music,
    })
  } catch (error) {
    console.log("Error upload music ", error)
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const uploadCoverImage = async (req, res) => {
  try {
    const { id } = req.params

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      })
    }

    const music = await Music.findById(id)

    if (!music) {
      fs.unlinkSync(req.file.path)
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      })
    }

    if (music.uploadedBy.toString() !== req.user.userId.toString()) {
      fs.unlinkSync(req.file.path)
      return res.status(403).json({
        success: false,
        message: "You do not have permission to modify this track.",
      })
    }

    if (music.coverImage) {
      const oldCoverPath = path.join(__dirname, "..", music.coverImage)
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath)
      }
    }
    const fileName = path.basename(req.file.path)

    music.coverImage = `${process.env.BASE_URL}/uploads/images/${fileName}`
      await music.save()

    res.status(200).json({
      success: true,
      message: "✅ The cover has been uploaded successfully",
      data: {
        coverImage: music.coverImage,
      },
    })
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path)
    console.log("Error upload image ", error)
    return res.status(500).json({
      success: false,
      message: "Server error while uploading",
    })
  }
}

export const updateMusic = async (req, res) => {
  try {
    const { id } = req.params
    const { title, artist, album, genre, tags, isPublic } = req.body

    const music = await Music.findById(id)

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      })
    }

    if (music.uploadedBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to modify this track.",
      })
    }

    if (title) music.title = title
    if (artist) music.artist = artist
    if (album) music.album = album
    if (genre) music.genre = genre
    if (typeof isPublic === "boolean") music.isPublic = isPublic

    if (tags) {
      music.tags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    }

    await music.save()
    await music.populate("uploadedBy", "username")

    res.status(200).json({
      success: true,
      message: "The song has been updated",
      data: music,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const deleteMusic = async (req, res) => {
  try {
    const { id } = req.params

    const music = await Music.findById(id)

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      })
    }

    if (music.uploadedBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this song",
      })
    }

    if (music.filePath && fs.existsSync(music.filePath)) {
      fs.unlinkSync(music.filePath)
    }

    if (music.coverImage && fs.existsSync(music.coverImage)) {
      fs.unlinkSync(music.coverImage)
    }

    await Music.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: "The song has been removed",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const likeMusic = async (req, res) => {
  try {
    const { id } = req.params

    const music = await Music.findById(id)

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      })
    }

    const alreadyLiked = music.likes.includes(req.user.userId)

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: "You already liked this song",
      })
    }

    await music.like(req.user.userId)

    res.status(200).json({
      success: true,
      message: "The song has been liked",
      likeCount: music.likeCount,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export const unlikeMusic = async (req, res) => {
  try {
    const { id } = req.params

    const music = await Music.findById(id)

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      })
    }

    await music.unlike(req.user.userId)

    res.status(200).json({
      success: true,
      message: "The like was revoked",

        likeCount: music.likeCount,

    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

// Play song (increase counter)
export const playMusic = async (req, res) => {
  try {
    const { id } = req.params

    const music = await Music.findById(id)

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Song not found.",
      })
    }

    await music.incrementPlayCount()

    // Add to user's recently played list
    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { "preferences.recentlyPlayed": id },
    })

    res.status(200).json({
      success: true,
      message: "The song was played",
      playCount: music.playCount,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

// Get my songs
export const getMyMusic = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const music = await Music.find({ uploadedBy: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    const total = await Music.countDocuments({ uploadedBy: req.user.userId })

    res.status(200).json({
      success: true,
      data: music,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
