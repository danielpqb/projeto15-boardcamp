import { connection } from "../database/database.js";
import joi from "joi";
import joiDate from "@joi/date";

async function getCustomers(req, res) {
  const { cpf } = req.query;

  try {
    if (cpf) {
      const customers = await connection.query(
        `SELECT * FROM customers
        WHERE cpf LIKE $1;`,
        [`${cpf}%`]
      );
      res.send(customers.rows);
      return;
    }

    const customers = await connection.query(`SELECT * FROM customers;`);

    res.send(customers.rows);
  } catch (error) {
    res.status(500).send(error);
  }
}

async function getCustomerById(req, res) {
  const { id } = req.params;

  try {
    const customer = (
      await connection.query(`SELECT * FROM customers WHERE id = $1;`, [id])
    ).rows[0];

    if (!customer) {
      res.status(404).send({ error: "Customer not found" });
      return;
    }

    res.status(200).send(customer);
    return;
  } catch (error) {
    res.status(500).send(error);
  }
}

async function createCustomer(req, res) {
  const customerSchema = joi.object({
    name: joi.string().required(),
    phone: joi
      .string()
      .pattern(/^[0-9]?[0-9]{10}$/)
      .required(),
    cpf: joi
      .string()
      .pattern(/^[0-9]{11}$/)
      .required(),
    birthday: joi.extend(joiDate).date().format("YYYY-MM-DD").required(),
  });
  const validation = customerSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((v) => v.message);
    return res.status(400).send(errors);
  }

  const { name, phone, cpf, birthday } = req.body;

  try {
    const exists = (
      await connection.query(`SELECT * FROM customers WHERE cpf = $1;`, [cpf])
    ).rows[0];
    if (exists) {
      res.status(409).send({ message: "CPF already exists!" });
      return;
    }

    await connection.query(
      `INSERT INTO customers (name, phone, cpf, birthday) 
    VALUES ($1, $2, $3, $4)`,
      [name, phone, cpf, birthday]
    );
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error);
  }
}

async function updateCustomerById(req, res) {
  const validation = customerSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((v) => v.message);
    return res.status(400).send(errors);
  }

  const { id } = req.params;
  const { name, phone, cpf, birthday } = req.body;

  try {
    const existsCPF = (
      await connection.query(`SELECT * FROM customers WHERE cpf = $1;`, [cpf])
    ).rows[0];
    if (existsCPF) {
      res.status(409).send({ message: "CPF already exists!" });
      return;
    }

    const customer = (
      await connection.query(`SELECT * FROM customers WHERE id = $1;`, [id])
    ).rows[0];
    if (!customer) {
      res.status(404).send({ error: "Customer not found!" });
      return;
    }

    await connection.query(
      `UPDATE customers SET
    name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5`,
      [name, phone, cpf, birthday, id]
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error);
  }
}

export { getCustomers, getCustomerById, createCustomer, updateCustomerById };
