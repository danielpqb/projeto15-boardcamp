import express from "express";
import {
  createRental,
  deleteRental,
  endRental,
  getRentals,
} from "../controllers/rentals.controller.js";

const router = express.Router();

router.get("/rentals", getRentals);
router.post("/rentals", createRental);
router.post("/rentals/:id/return", endRental);
router.delete("/rentals/:id", deleteRental);

export default router;
