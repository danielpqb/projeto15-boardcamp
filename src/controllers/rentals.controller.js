import dayjs from "dayjs";
import { connection } from "../database/database.js";
import joi from "joi";

async function getRentals(req, res) {
  const { customerId, gameId } = req.query;

  try {
    if (customerId && !gameId) {
      const rentals = (
        await connection.query(
          `SELECT rentals.*, 
            json_build_object('id', customers.id, 'name', customers.name) AS customer,
            json_build_object('id', games.id, 'name', games.name, 
            'categoryId', games."categoryId", 'categoryName', categories.name) AS game
            FROM rentals JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON games."categoryId" = categories.id
            WHERE rentals."customerId" = $1;`,
          [customerId]
        )
      ).rows;
      return res.status(200).send(rentals);
    } else if (!customerId && gameId) {
      const rentals = (
        await connection.query(
          `SELECT rentals.*, 
          json_build_object('id', customers.id, 'name', customers.name) AS customer,
          json_build_object('id', games.id, 'name', games.name, 
          'categoryId', games."categoryId", 'categoryName', categories.name) AS game
          FROM rentals JOIN customers ON rentals."customerId" = customers.id
          JOIN games ON rentals."gameId" = games.id
          JOIN categories ON games."categoryId" = categories.id
          WHERE rentals."gameId" = $1;`,
          [gameId]
        )
      ).rows;
      return res.status(200).send(rentals);
    } else if (customerId && gameId) {
      const rentals = (
        await connection.query(
          `SELECT rentals.*, 
            json_build_object('id', customers.id, 'name', customers.name) AS customer,
            json_build_object('id', games.id, 'name', games.name, 
            'categoryId', games."categoryId", 'categoryName', categories.name) AS game
            FROM rentals JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON games."categoryId" = categories.id
            WHERE rentals."customerId" = $1 AND rentals."gameId" = $2;`,
          [customerId, gameId]
        )
      ).rows;
      return res.status(200).send(rentals);
    } else {
      const rentals = (
        await connection.query(
          `SELECT rentals.*, 
        json_build_object('id', customers.id, 'name', customers.name) AS customer,
        json_build_object('id', games.id, 'name', games.name, 
        'categoryId', games."categoryId", 'categoryName', categories.name) AS game
        FROM rentals JOIN customers ON rentals."customerId" = customers.id
        JOIN games ON rentals."gameId" = games.id
        JOIN categories ON games."categoryId" = categories.id;`
        )
      ).rows;
      return res.status(200).send(rentals);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function createRental(req, res) {
  const { customerId, gameId, daysRented } = req.body;

  const rentalSchema = joi.object({
    customerId: joi.number().required(),
    gameId: joi.number().required(),
    daysRented: joi.number().positive().integer().required(),
  });
  const validation = rentalSchema.validate(req.body, { abortEarly: false });

  try {
    const customer = (
      await connection.query(`SELECT * FROM customers WHERE id = $1;`, [
        customerId,
      ])
    ).rows[0];
    const game = (
      await connection.query(`SELECT * FROM games WHERE id = $1;`, [gameId])
    ).rows[0];
    const gameRentals = (
      await connection.query(
        `SELECT * FROM rentals WHERE "returnDate" = null AND "gameId" = $1;`,
        [gameId]
      )
    ).rows.length;

    if (
      validation.error ||
      !customer ||
      !game ||
      (game !== undefined && game.stockTotal === gameRentals)
    ) {
      let errors = [];
      if (validation.error) {
        errors = validation.error.details.map((v) => v.message);
      }
      if (!customer) {
        errors.push({ message: "Customer doesn't exist!" });
      }
      if (!game) {
        errors.push({ message: "Game doesn't exist!" });
      }
      if (game !== undefined && game.stockTotal === gameRentals) {
        errors.push({ message: "All units already rented!" });
      }
      return res.status(400).send(errors);
    }

    await connection.query(
      `INSERT INTO rentals 
    ("customerId", "gameId", "rentDate", "daysRented", 
    "returnDate", "originalPrice", "delayFee")
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        customerId,
        gameId,
        dayjs().format("YYYY-MM-DD"),
        daysRented,
        null,
        game.pricePerDay * daysRented,
        null,
      ]
    );
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error);
  }
}

async function endRental(req, res) {
  const { id } = req.params;

  try {
    const rental = (
      await connection.query("SELECT * FROM rentals WHERE id = $1", [id])
    ).rows[0];
    if (!rental) {
      return res.status(404).send({ message: "Rental doesn't exist!" });
    }
    if (rental.returnDate) {
      return res.status(400).send({ message: "Rental already finished!" });
    }

    const today = dayjs();
    const rentalDays = today.diff(rental.rentDate, "day");
    let delayFee = 0;

    if (rentalDays > rental.daysRented) {
      delayFee =
        (rentalDays - rental.daysRented) *
        (rental.originalPrice / rental.daysRented);
    }
    await connection.query(
      `UPDATE rentals 
    SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3`,
      [dayjs(today).format("YYYY-MM-DD"), delayFee, id]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error);
  }
}

async function deleteRental(req, res) {
  const { id } = req.params;

  try {
    const rental = (
      await connection.query("SELECT * FROM rentals WHERE id = $1", [id])
    ).rows[0];
    if (!rental) {
      res.status(404).send({ message: "Rental doesn't exist!" });
      return;
    }
    if (rental.returnDate === null) {
      res.status(400).send({ message: "Rental is NOT finished!" });
      return;
    }

    await connection.query("DELETE FROM rentals WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error);
  }
}

export { getRentals, createRental, endRental, deleteRental };
