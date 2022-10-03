import { connection } from "../database/database.js";

async function getCategories(req, res) {
  try {
    const categories = await connection.query("SELECT * FROM categories;");
    res.send(categories.rows);
  } catch (error) {
    res.status(500).send(error);
  }
}

async function postCategory(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("Name NOT found!");
  }

  try {
    const exists = await connection.query(
      "SELECT * FROM categories WHERE name = $1",
      [name]
    );

    if (exists.rows[0]) {
      res.status(409).send("Name already exists!");
      return;
    }

    await connection.query("INSERT INTO categories (name) VALUES ($1);", [
      name,
    ]);
    res.sendStatus(201);
    return;
  } catch (error) {
    res.status(500).send(error);
    return;
  }
}

export { getCategories, postCategory };
