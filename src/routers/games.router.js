import express from "express";
import { createGame, getGames } from "../controllers/games.controller.js";

const router = express.Router();

router.get("/games", getGames);
router.post("/games", createGame);

export default router;
