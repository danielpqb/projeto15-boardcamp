import express from "express";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomerById,
} from "../controllers/customers.controller.js";

const router = express.Router();

router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomerById);
router.post("/customers", createCustomer);
router.put("/customers/:id", updateCustomerById);

export default router;
