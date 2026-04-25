import { Router } from "express";
import { query } from "../db.js";

export const productsRouter = Router();

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    createdAt: row.created_at,
  };
}

productsRouter.get("/", async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const conds = [];
    const params = [];
    if (category) {
      params.push(category);
      conds.push(`category = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conds.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length})`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const r = await query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC`,
      params,
    );
    res.json(r.rows.map(mapProduct));
  } catch (e) {
    next(e);
  }
});

productsRouter.post("/", async (req, res, next) => {
  try {
    const { name, sku, category, price, stock } = req.body;
    const r = await query(
      `INSERT INTO products (name, sku, category, price, stock, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [name, sku, category, price, stock || 0],
    );
    res.status(201).json(mapProduct(r.rows[0]));
  } catch (e) {
    next(e);
  }
});

productsRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, sku, category, price, stock } = req.body;
    const r = await query(
      `UPDATE products SET
         name = COALESCE($2, name),
         sku = COALESCE($3, sku),
         category = COALESCE($4, category),
         price = COALESCE($5, price),
         stock = COALESCE($6, stock)
       WHERE id = $1
       RETURNING *`,
      [id, name, sku, category, price, stock],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Product not found" });
    res.json(mapProduct(r.rows[0]));
  } catch (e) {
    next(e);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await query(`DELETE FROM products WHERE id = $1`, [id]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
