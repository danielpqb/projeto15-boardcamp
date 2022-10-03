import connection from "../database/database.js";
import joi from "joi";

async function getGames(req, res) {
  const { name } = req.query;

  try {
    if (name) {
      const games = await connection.query(
        `SELECT games.*, categories.name AS "categoryName" 
            FROM games JOIN categories ON games."categoryId" = categories.id
            WHERE LOWER (games.name) LIKE $1;`,
        [`${nameQuery.toLowerCase()}%`]
      );
      return res.status(200).send(games.rows);
    }

    const games = await connection.query(
      `SELECT games.*, categories.name AS "categoryName" 
          FROM games JOIN categories ON games."categoryId" = categories.id;`
    );
    res.status(200).send(games.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function createGame(req, res) {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

  const gameSchema = joi.object({
    name: joi.string().required(),
    image: joi.string().uri().required(),
    stockTotal: joi.number().integer().positive().required(),
    categoryId: joi.number().required(),
    pricePerDay: joi.number().positive().required(),
  });
  const validation = gameSchema.validate(req.body, { abortEarly: false });

  try {
    if (validation.error) {
      const errors = validation.error.details.map((v) => v.message);
      res.status(400).send(errors);
      return;
    }

    const category = await connection.query(
      "SELECT * FROM categories WHERE id = $1",
      [categoryId]
    );
    if (!category.rows[0]) {
      res.status(400).send({ message: "Category doesn't exist!" });
    }

    const exists = await connection.query(
      "SELECT * FROM games WHERE name = $1",
      [name]
    );
    if (exists.rows[0]) {
      return res.status(409).send({ error: "Game name already exists!" });
    }

    await connection.query(
      `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") 
        VALUES ($1, $2, $3, $4, $5);`,
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export { getGames, createGame };
