import { Router, type IRouter } from "express";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  DeleteProductParams,
  ListProductsQueryParams,
  ListProductsResponse,
  ListProductsResponseItem,
  UpdateProductBody,
  UpdateProductParams,
  UpdateProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function rowToProduct(row: typeof productsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    createdAt: row.createdAt,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.search) {
    const term = `%${params.data.search}%`;
    conditions.push(ilike(productsTable.name, term));
  }
  if (params.data.category) {
    conditions.push(eq(productsTable.category, params.data.category));
  }

  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(productsTable.createdAt));

  res.json(ListProductsResponse.parse(rows.map(rowToProduct)));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(productsTable)
    .values({
      name: parsed.data.name,
      sku: parsed.data.sku,
      category: parsed.data.category,
      price: parsed.data.price.toString(),
      stock: parsed.data.stock,
    })
    .returning();

  res.status(201).json(ListProductsResponseItem.parse(rowToProduct(row!)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.sku !== undefined) updates.sku = parsed.data.sku;
  if (parsed.data.category !== undefined)
    updates.category = parsed.data.category;
  if (parsed.data.price !== undefined)
    updates.price = parsed.data.price.toString();
  if (parsed.data.stock !== undefined) updates.stock = parsed.data.stock;

  const [row] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(rowToProduct(row)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
