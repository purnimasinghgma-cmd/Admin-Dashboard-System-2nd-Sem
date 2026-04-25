import { Router } from "express";
import { query } from "../db.js";

export const dashboardRouter = Router();

function pctChange(curr, prev) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const now = new Date();
    const start30 = new Date(now);
    start30.setDate(start30.getDate() - 30);
    const start60 = new Date(now);
    start60.setDate(start60.getDate() - 60);

    const cur = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS rev,
              COUNT(*)::int AS cnt
       FROM orders
       WHERE created_at >= $1 AND status NOT IN ('cancelled','refunded')`,
      [start30],
    );
    const prev = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS rev,
              COUNT(*)::int AS cnt
       FROM orders
       WHERE created_at >= $1 AND created_at < $2 AND status NOT IN ('cancelled','refunded')`,
      [start60, start30],
    );

    const usersCur = await query(
      `SELECT COUNT(*)::int AS c FROM users WHERE created_at >= $1`,
      [start30],
    );
    const usersPrev = await query(
      `SELECT COUNT(*)::int AS c FROM users WHERE created_at >= $1 AND created_at < $2`,
      [start60, start30],
    );
    const totalUsers = await query(`SELECT COUNT(*)::int AS c FROM users`);
    const activeProducts = await query(
      `SELECT COUNT(*)::int AS c FROM products WHERE stock > 0`,
    );

    const aovCur = cur.rows[0].cnt ? cur.rows[0].rev / cur.rows[0].cnt : 0;
    const aovPrev = prev.rows[0].cnt ? prev.rows[0].rev / prev.rows[0].cnt : 0;

    res.json({
      totalRevenue: Math.round(cur.rows[0].rev),
      revenueChangePct: pctChange(cur.rows[0].rev, prev.rows[0].rev),
      totalOrders: cur.rows[0].cnt,
      ordersChangePct: pctChange(cur.rows[0].cnt, prev.rows[0].cnt),
      totalUsers: totalUsers.rows[0].c,
      usersChangePct: pctChange(usersCur.rows[0].c, usersPrev.rows[0].c),
      averageOrderValue: Math.round(aovCur * 100) / 100,
      aovChangePct: pctChange(aovCur, aovPrev),
      activeProducts: activeProducts.rows[0].c,
    });
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get("/sales-by-day", async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT date_trunc('day', created_at)::date AS day,
              COALESCE(SUM(amount), 0)::float AS revenue,
              COUNT(*)::int AS orders
       FROM orders
       WHERE created_at >= now() - interval '30 days'
         AND status NOT IN ('cancelled','refunded')
       GROUP BY day
       ORDER BY day ASC`,
    );
    res.json(
      r.rows.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        revenue: Math.round(row.revenue),
        orders: row.orders,
      })),
    );
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get("/users-by-day", async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT date_trunc('day', created_at)::date AS day,
              COUNT(*)::int AS signups
       FROM users
       WHERE created_at >= now() - interval '30 days'
       GROUP BY day
       ORDER BY day ASC`,
    );
    res.json(
      r.rows.map((row) => ({
        date: row.day.toISOString().slice(0, 10),
        signups: row.signups,
      })),
    );
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get("/sales-by-category", async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT product_category AS category,
              COALESCE(SUM(amount), 0)::float AS revenue,
              COUNT(*)::int AS orders
       FROM orders
       WHERE status NOT IN ('cancelled','refunded')
       GROUP BY product_category
       ORDER BY revenue DESC`,
    );
    res.json(
      r.rows.map((row) => ({
        category: row.category,
        revenue: Math.round(row.revenue),
        orders: row.orders,
      })),
    );
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get("/top-products", async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT product_name AS name,
              COALESCE(SUM(amount), 0)::float AS revenue,
              COUNT(*)::int AS orders
       FROM orders
       WHERE status NOT IN ('cancelled','refunded')
       GROUP BY product_name
       ORDER BY revenue DESC
       LIMIT 8`,
    );
    res.json(
      r.rows.map((row) => ({
        name: row.name,
        revenue: Math.round(row.revenue),
        orders: row.orders,
      })),
    );
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get("/recent-activity", async (_req, res, next) => {
  try {
    const orders = await query(
      `SELECT id, order_number, customer_name, product_name, amount, created_at
       FROM orders ORDER BY created_at DESC LIMIT 6`,
    );
    const users = await query(
      `SELECT id, name, role, created_at
       FROM users ORDER BY created_at DESC LIMIT 4`,
    );
    const items = [
      ...orders.rows.map((o) => ({
        type: "order",
        id: `order-${o.id}`,
        title: `New order ${o.order_number}`,
        description: `${o.customer_name} ordered ${o.product_name}`,
        amount: Number(o.amount),
        timestamp: o.created_at,
      })),
      ...users.rows.map((u) => ({
        type: "user",
        id: `user-${u.id}`,
        title: `${u.name} joined`,
        description: `Signed up as ${u.role}`,
        timestamp: u.created_at,
      })),
    ];
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    res.json(items.slice(0, 10));
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get("/order-status-breakdown", async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
    );
    const order = ["pending", "paid", "shipped", "refunded", "cancelled"];
    const map = Object.fromEntries(r.rows.map((x) => [x.status, x.count]));
    res.json(order.map((s) => ({ status: s, count: map[s] || 0 })));
  } catch (e) {
    next(e);
  }
});
