import express from "express";

import {
  getCategories,
  postCategory,
} from "../controllers/categories.controller.js";

const router = express.Router();

router.get("/categories", getCategories);
router.post("/categories", postCategory);

export default router;
