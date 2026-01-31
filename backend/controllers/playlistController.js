import Playlist from "../models/Playlist.js"
import Music from "../models/Music.js"
import User from "../models/User.js"
import { StatusCodes } from "http-status-codes"
import {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} from "../errors/index.js"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const canAccess = (playlist, userId) =>
  playlist.owner.toString() === userId || playlist.isPublic

/* ----------- COVER ----------- */
export const uploadCover = async (req, res) => {
  if (!req.file) throw new BadRequestError("Image file is required")
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (playlist.owner.toString() !== req.user.userId)
    throw new UnauthenticatedError("Only owner can change cover")
  // delete old image
  if (playlist.coverImage) {
    const oldFile = playlist.coverImage.replace(`${process.env.BASE_URL}/`, "") // delete domain
    const oldPath = path.join(__dirname, "..", oldFile)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }
  const fileName = path.basename(req.file.path)
  playlist.coverImage = `${process.env.BASE_URL}/uploads/images/${fileName}`
  await playlist.save()

  res.status(StatusCodes.OK).json({
    success: true,
    data: { coverImage: playlist.coverImage },
  })
}

export const deleteCover = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (playlist.owner.toString() !== req.user.userId)
    throw new UnauthenticatedError("Only owner can delete cover")
  if (playlist.coverImage) {
    const oldFile = playlist.coverImage.replace(`${process.env.BASE_URL}/`, "")
    const oldPath = path.join(__dirname, "..", oldFile)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    playlist.coverImage = null
    await playlist.save()
  }
  res.status(StatusCodes.OK).json({ success: true, msg: "Cover removed" })
}

/* ----------- CRUD ----------- */
export const createPlaylist = async (req, res) => {
  const { name, description, isPublic = false, genres = [] } = req.body
  if (!name) throw new BadRequestError("Playlist name is required")
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user.userId,
    isPublic,
    genres: genres.map((g) => g.toLowerCase()),
  })
  await User.findByIdAndUpdate(req.user.userId, {
    $push: { "preferences.playlists": playlist._id },
  })
  res.status(StatusCodes.CREATED).json({ success: true, data: playlist })
}

export const getMyPlaylists = async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user.userId })
    .populate("tracks", "title artist coverImage duration filePath")
    .sort({ updatedAt: -1 })
  res.status(StatusCodes.OK).json({ success: true, data: playlists })
}

export const getPlaylistById = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
    .populate("owner", "username")
    .populate("tracks", "title artist coverImage duration filePath")
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (!canAccess(playlist, req.user.userId))
    throw new UnauthenticatedError("No access to this playlist")
  res.status(StatusCodes.OK).json({ success: true, data: playlist })
}

export const updatePlaylist = async (req, res) => {
  const { name, description, isPublic } = req.body
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (playlist.owner.toString() !== req.user.userId)
    throw new UnauthenticatedError("You can edit only your own playlists")
  if (name !== undefined) playlist.name = name
  if (description !== undefined) playlist.description = description
  if (typeof isPublic === "boolean") playlist.isPublic = isPublic
  await playlist.save()
  res.status(StatusCodes.OK).json({ success: true, data: playlist })
}

export const deletePlaylist = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (playlist.owner.toString() !== req.user.userId)
    throw new UnauthenticatedError("You can delete only your own playlists")
  await Playlist.findByIdAndDelete(req.params.id)
  // usuń też z listy użytkownika
  await User.findByIdAndUpdate(req.user.userId, {
    $pull: { "preferences.playlists": req.params.id },
  })
  res.status(StatusCodes.OK).json({ success: true, msg: "Playlist deleted" })
}

/* ----------- TRACKS ----------- */
export const addTrack = async (req, res) => {
  const { musicId } = req.body
  if (!musicId) throw new BadRequestError("musicId is required")
  const [playlist, music] = await Promise.all([
    Playlist.findById(req.params.id),
    Music.findById(musicId),
  ])
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (!music) throw new NotFoundError("Music not found")
  if (playlist.owner.toString() !== req.user.userId)
    throw new UnauthenticatedError("You can edit only your own playlists")
  await playlist.addTrack(musicId)
  res.status(StatusCodes.OK).json({ success: true, msg: "Track added" })
}

export const removeTrack = async (req, res) => {
  const { musicId } = req.params
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (playlist.owner.toString() !== req.user.userId)
    throw new UnauthenticatedError("You can edit only your own playlists")
  await playlist.removeTrack(musicId)
  res.status(StatusCodes.OK).json({ success: true, msg: "Track removed" })
}

/* ----------- FOLLOW ----------- */
export const followPlaylist = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  if (playlist.owner.toString() === req.user.userId)
    throw new BadRequestError("You cannot follow your own playlist")
  await playlist.follow(req.user.userId)
  res.status(StatusCodes.OK).json({ success: true, msg: "Playlist followed" })
}

export const unfollowPlaylist = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
  if (!playlist) throw new NotFoundError("Playlist not found")
  await playlist.unfollow(req.user.userId)
  res.status(StatusCodes.OK).json({ success: true, msg: "Playlist unfollowed" })
}

export const getPublicPlaylists = async (req, res) => {
  const { page = 1, limit = 20, search, genre, sort = "followers" } = req.query
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  const filters = { isPublic: true }
  if (search) filters.text = { search: search }
  if (genre) filters.genres = { $in: [genre.toLowerCase()] } // ➜ FILTR
  let sortObj = {}
  switch (sort) {
    case "newest":
      sortObj = { createdAt: -1 }
      break
    case "oldest":
      sortObj = { createdAt: 1 }
      break
    case "followers":
    default:
      sortObj = { followerCount: -1, createdAt: -1 }
      break
  }
  const playlists = await Playlist.find(filters)
    //.populate("owner", "username")
    .populate("tracks", "title artist")
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
  const total = await Playlist.countDocuments(filters)
  res.status(StatusCodes.OK).json({
    success: true,
    data: playlists,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  })
}
