import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
  ListOrdersResponse,
  ListOrdersResponseItem,
  UpdateOrderBody,
  UpdateOrderParams,
  UpdateOrderResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function rowToOrder(row: typeof ordersTable.$inferSelect) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    productName: row.productName,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.createdAt,
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.search) {
    const term = `%${params.data.search}%`;
    conditions.push(
      or(
        ilike(ordersTable.orderNumber, term),
        ilike(ordersTable.customerName, term),
        ilike(ordersTable.customerEmail, term),
        ilike(ordersTable.productName, term),
      )!,
    );
  }
  if (params.data.status) {
    conditions.push(eq(ordersTable.status, params.data.status));
  }

  const rows = await db
    .select()
    .from(ordersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  res.json(ListOrdersResponse.parse(rows.map(rowToOrder)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;

  const [row] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      amount: parsed.data.amount.toString(),
      status: parsed.data.status ?? "pending",
    })
    .returning();

  res.status(201).json(ListOrdersResponseItem.parse(rowToOrder(row!)));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(UpdateOrderResponse.parse(rowToOrder(row)));
});

export default router;
