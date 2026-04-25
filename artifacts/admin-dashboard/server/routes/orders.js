import { Router } from "express";
import { query } from "../db.js";

export const ordersRouter = Router();

function mapOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    productName: row.product_name,
    productCategory: row.product_category,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
  };
}

ordersRouter.get("/", async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const conds = [];
    const params = [];
    if (status) {
      params.push(status);
      conds.push(`status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conds.push(
        `(order_number ILIKE $${params.length} OR customer_name ILIKE $${params.length} OR product_name ILIKE $${params.length})`,
      );
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const r = await query(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT 500`,
      params,
    );
    res.json(r.rows.map(mapOrder));
  } catch (e) {
    next(e);
  }
});

ordersRouter.post("/", async (req, res, next) => {
  try {
    const {
      orderNumber,
      customerName,
      customerEmail,
      productName,
      productCategory,
      amount,
      status,
    } = req.body;
    const r = await query(
      `INSERT INTO orders (
         order_number, customer_name, customer_email,
         product_name, product_category, amount, status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING *`,
      [
        orderNumber,
        customerName,
        customerEmail,
        productName,
        productCategory,
        amount,
        status || "pending",
      ],
    );
    res.status(201).json(mapOrder(r.rows[0]));
  } catch (e) {
    next(e);
  }
});

ordersRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, amount } = req.body;
    const r = await query(
      `UPDATE orders SET
         status = COALESCE($2, status),
         amount = COALESCE($3, amount)
       WHERE id = $1
       RETURNING *`,
      [id, status, amount],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Order not found" });
    res.json(mapOrder(r.rows[0]));
  } catch (e) {
    next(e);
  }
});

ordersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await query(`DELETE FROM orders WHERE id = $1`, [id]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
