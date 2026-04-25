import { Router } from "express";
import { authRouter } from "./auth.js";
import { usersRouter } from "./users.js";
import { productsRouter } from "./products.js";
import { ordersRouter } from "./orders.js";
import { dashboardRouter } from "./dashboard.js";

export const apiRouter = Router();

apiRouter.get("/healthz", (_req, res) => res.json({ ok: true }));
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/dashboard", dashboardRouter);

apiRouter.use((err, _req, res, _next) => {
  console.error("[api error]", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});
