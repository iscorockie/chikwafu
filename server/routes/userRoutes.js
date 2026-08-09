import express from "express";
import {
  getUsers,
  updateUserRole,
  deleteUser,
  toggleWishlist,
  getWishlist,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, admin, getUsers);
router.put("/:id", protect, admin, updateUserRole);
router.delete("/:id", protect, admin, deleteUser);
router.get("/wishlist/mine", protect, getWishlist);
router.post("/wishlist/:productId", protect, toggleWishlist);

export default router;
