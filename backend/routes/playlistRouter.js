import express from "express";
import { protect } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
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
deleteCover
} from "../controllers/playlistController.js";

const router = express.Router();
// Public
router.get("/public", getPublicPlaylists);

router.post("/:id/cover", protect, uploadImage.single("image"), uploadCover);
router.delete("/:id/cover", protect, deleteCover);

// Protect
router.use(protect);

router.post("/", createPlaylist);
router.get("/", getMyPlaylists);
router.get("/:id", getPlaylistById);
router.put("/:id", updatePlaylist);
router.delete("/:id", deletePlaylist);
router.patch("/:id/tracks", addTrack);      // body: { musicId }
router.delete("/:id/tracks/:musicId", removeTrack);
router.patch("/:id/follow", followPlaylist);
router.delete("/:id/follow", unfollowPlaylist);

export default router;