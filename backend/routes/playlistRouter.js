import express from "express"
import { protect } from "../middleware/auth.js"
import { uploadImage } from "../middleware/upload.js"
import {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addTrack,
  removeTrack,
  followPlaylist,
  unfollowPlaylist,
  getPublicPlaylists,
  uploadCover,
  deleteCover,
} from "../controllers/playlistController.js"

const router = express.Router()
// Public
router.get("/public", getPublicPlaylists)

router.post("/:id/cover", protect, uploadImage.single("image"), uploadCover)
router.delete("/:id/cover", protect, deleteCover)

router.post("/", protect, createPlaylist)
router.get("/", protect, getMyPlaylists)
router.get("/:id", protect, getPlaylistById)
router.put("/:id", protect, updatePlaylist)
router.delete("/:id", protect, deletePlaylist)
router.patch("/:id/tracks", protect, addTrack) // body: { musicId }
router.delete("/:id/tracks/:musicId", protect, removeTrack)
router.patch("/:id/follow", protect, followPlaylist)
router.delete("/:id/follow", protect, unfollowPlaylist)

export default router
