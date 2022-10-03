import express from "express";
import cors from "cors";

import categoriesRouter from "./routers/categories.router.js";
import gamesRouter from "./routers/games.router.js";
import customersRouter from "./routers/customers.router.js";
import rentalsRouter from "./routers/rentals.router.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use(categoriesRouter);
app.use(gamesRouter);
app.use(customersRouter);
app.use(rentalsRouter);

export default app;
