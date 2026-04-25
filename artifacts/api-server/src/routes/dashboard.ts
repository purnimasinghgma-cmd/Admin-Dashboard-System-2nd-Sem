import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetOrderStatusBreakdownResponse,
  GetRecentActivityResponse,
  GetSalesByCategoryResponse,
  GetSalesByDayResponse,
  GetTopProductsResponse,
  GetUsersByDayResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function pctChange(current: number, prev: number): number {
  if (prev === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - prev) / prev) * 1000) / 10;
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const last30Start = new Date(now.getTime() - 30 * DAY_MS);
  const prev30Start = new Date(now.getTime() - 60 * DAY_MS);

  const [currentOrders, prevOrders, totalUsersRow, prevUsersRow, productsRow] =
    await Promise.all([
      db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${ordersTable.amount}), 0)::float`,
        })
        .from(ordersTable)
        .where(
          and(
            gte(ordersTable.createdAt, last30Start),
            ne(ordersTable.status, "cancelled"),
            ne(ordersTable.status, "refunded"),
          ),
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${ordersTable.amount}), 0)::float`,
        })
        .from(ordersTable)
        .where(
          and(
            gte(ordersTable.createdAt, prev30Start),
            sql`${ordersTable.createdAt} < ${last30Start}`,
            ne(ordersTable.status, "cancelled"),
            ne(ordersTable.status, "refunded"),
          ),
        ),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(sql`${usersTable.createdAt} < ${last30Start}`),
      db.select({ count: sql<number>`count(*)::int` }).from(productsTable),
    ]);

  const cur = currentOrders[0]!;
  const prev = prevOrders[0]!;
  const totalUsers = totalUsersRow[0]!.count;
  const prevTotalUsers = prevUsersRow[0]!.count;
  const activeProducts = productsRow[0]!.count;

  const aov = cur.count > 0 ? cur.revenue / cur.count : 0;
  const prevAov = prev.count > 0 ? prev.revenue / prev.count : 0;

  const summary = {
    totalRevenue: Math.round(cur.revenue * 100) / 100,
    revenueChangePct: pctChange(cur.revenue, prev.revenue),
    totalOrders: cur.count,
    ordersChangePct: pctChange(cur.count, prev.count),
    totalUsers,
    usersChangePct: pctChange(totalUsers, prevTotalUsers),
    averageOrderValue: Math.round(aov * 100) / 100,
    aovChangePct: pctChange(aov, prevAov),
    activeProducts,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/sales-by-day", async (_req, res): Promise<void> => {
  const now = new Date();
  const start = startOfDay(new Date(now.getTime() - 29 * DAY_MS));

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${ordersTable.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${ordersTable.amount}), 0)::float`,
      orders: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(
      and(
        gte(ordersTable.createdAt, start),
        ne(ordersTable.status, "cancelled"),
        ne(ordersTable.status, "refunded"),
      ),
    )
    .groupBy(sql`date_trunc('day', ${ordersTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${ordersTable.createdAt})`);

  const byDay = new Map(
    rows.map((r) => [r.day, { revenue: r.revenue, orders: r.orders }]),
  );

  const series = [];
  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(new Date(now.getTime() - i * DAY_MS));
    const key = d.toISOString().slice(0, 10);
    const v = byDay.get(key);
    series.push({
      date: key,
      revenue: v ? Math.round(v.revenue * 100) / 100 : 0,
      orders: v ? v.orders : 0,
    });
  }

  res.json(GetSalesByDayResponse.parse(series));
});

router.get("/dashboard/users-by-day", async (_req, res): Promise<void> => {
  const now = new Date();
  const start = startOfDay(new Date(now.getTime() - 29 * DAY_MS));

  const signupRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${usersTable.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .where(gte(usersTable.createdAt, start))
    .groupBy(sql`date_trunc('day', ${usersTable.createdAt})`);

  const activeRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${usersTable.lastActiveAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(usersTable)
    .where(gte(usersTable.lastActiveAt, start))
    .groupBy(sql`date_trunc('day', ${usersTable.lastActiveAt})`);

  const signupMap = new Map(signupRows.map((r) => [r.day, r.count]));
  const activeMap = new Map(activeRows.map((r) => [r.day, r.count]));

  const series = [];
  for (let i = 29; i >= 0; i--) {
    const d = startOfDay(new Date(now.getTime() - i * DAY_MS));
    const key = d.toISOString().slice(0, 10);
    series.push({
      date: key,
      signups: signupMap.get(key) ?? 0,
      activeUsers: activeMap.get(key) ?? 0,
    });
  }

  res.json(GetUsersByDayResponse.parse(series));
});

router.get("/dashboard/sales-by-category", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: ordersTable.productCategory,
      revenue: sql<number>`coalesce(sum(${ordersTable.amount}), 0)::float`,
      orders: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .where(
      and(
        ne(ordersTable.status, "cancelled"),
        ne(ordersTable.status, "refunded"),
      ),
    )
    .groupBy(ordersTable.productCategory)
    .orderBy(desc(sql<number>`sum(${ordersTable.amount})`));

  res.json(
    GetSalesByCategoryResponse.parse(
      rows.map((r) => ({
        category: r.category,
        revenue: Math.round(r.revenue * 100) / 100,
        orders: r.orders,
      })),
    ),
  );
});

router.get("/dashboard/top-products", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      productId: ordersTable.productId,
      name: ordersTable.productName,
      category: ordersTable.productCategory,
      unitsSold: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${ordersTable.amount}), 0)::float`,
    })
    .from(ordersTable)
    .where(
      and(
        ne(ordersTable.status, "cancelled"),
        ne(ordersTable.status, "refunded"),
      ),
    )
    .groupBy(
      ordersTable.productId,
      ordersTable.productName,
      ordersTable.productCategory,
    )
    .orderBy(desc(sql<number>`sum(${ordersTable.amount})`))
    .limit(8);

  res.json(
    GetTopProductsResponse.parse(
      rows.map((r) => ({
        productId: r.productId,
        name: r.name,
        category: r.category,
        unitsSold: r.unitsSold,
        revenue: Math.round(r.revenue * 100) / 100,
      })),
    ),
  );
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const [recentOrders, recentSignups] = await Promise.all([
    db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(8),
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(6),
  ]);

  type Item = {
    id: number;
    type: "order" | "signup" | "refund" | "product";
    title: string;
    description: string;
    amount?: number;
    createdAt: Date;
  };

  const items: Item[] = [];

  for (const o of recentOrders) {
    if (o.status === "refunded") {
      items.push({
        id: o.id + 100000,
        type: "refund",
        title: `Refund issued — ${o.orderNumber}`,
        description: `${o.customerName} refunded ${o.productName}`,
        amount: Number(o.amount),
        createdAt: o.createdAt,
      });
    } else {
      items.push({
        id: o.id,
        type: "order",
        title: `New order ${o.orderNumber}`,
        description: `${o.customerName} ordered ${o.productName}`,
        amount: Number(o.amount),
        createdAt: o.createdAt,
      });
    }
  }

  for (const u of recentSignups) {
    items.push({
      id: u.id + 200000,
      type: "signup",
      title: `${u.name} joined`,
      description: `Signed up as ${u.role}`,
      createdAt: u.createdAt,
    });
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(GetRecentActivityResponse.parse(items.slice(0, 12)));
});

router.get(
  "/dashboard/order-status-breakdown",
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        status: ordersTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.status);

    const ALL: Array<"pending" | "paid" | "shipped" | "refunded" | "cancelled"> = [
      "pending",
      "paid",
      "shipped",
      "refunded",
      "cancelled",
    ];
    const byStatus = new Map(rows.map((r) => [r.status, r.count]));
    const filled = ALL.map((status) => ({
      status,
      count: byStatus.get(status) ?? 0,
    }));

    res.json(GetOrderStatusBreakdownResponse.parse(filled));
  },
);

router.get("/dashboard/_seed", async (_req, res): Promise<void> => {
  // Compatibility no-op for older flows; seeding is a separate script.
  res.json({ status: "ok" });
});

export default router;

void eq;
