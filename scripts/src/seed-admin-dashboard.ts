import {
  db,
  ordersTable,
  productsTable,
  sessionTable,
  usersTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const DAY_MS = 24 * 60 * 60 * 1000;

const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Sam",
  "Riley",
  "Taylor",
  "Morgan",
  "Casey",
  "Quinn",
  "Reese",
  "Drew",
  "Hayden",
  "Skyler",
  "Parker",
  "Dakota",
  "Rowan",
  "Emerson",
  "Finley",
  "Harper",
  "Jamie",
  "Kai",
  "Logan",
  "Max",
  "Nico",
  "Oakley",
  "Peyton",
  "Sage",
  "Tatum",
  "Wren",
  "Yael",
  "Zion",
  "Ada",
  "Bex",
  "Cleo",
  "Devon",
  "Echo",
];
const LAST_NAMES = [
  "Chen",
  "Patel",
  "Rivera",
  "Nguyen",
  "Okafor",
  "Garcia",
  "Kim",
  "Brooks",
  "Hayes",
  "Holt",
  "Ito",
  "Jensen",
  "Khoury",
  "Lambert",
  "Mendez",
  "Novak",
  "Ortiz",
  "Pham",
  "Quintero",
  "Reyes",
  "Singh",
  "Tran",
  "Underwood",
  "Vance",
  "Wozniak",
  "Xu",
  "Yamamoto",
  "Zhao",
];

const PRODUCTS = [
  { name: "Northbeam Pro Headphones", category: "Audio", price: 249.0 },
  { name: "Northbeam Studio Monitor", category: "Audio", price: 399.0 },
  { name: "Northbeam Wireless Earbuds", category: "Audio", price: 149.0 },
  { name: "Aurora Smart Lamp", category: "Home", price: 89.0 },
  { name: "Aurora Diffuser", category: "Home", price: 64.0 },
  { name: "Aurora Throw Blanket", category: "Home", price: 79.0 },
  { name: "Pulse Fitness Tracker", category: "Wearables", price: 179.0 },
  { name: "Pulse Smart Ring", category: "Wearables", price: 299.0 },
  { name: "Pulse Sleep Band", category: "Wearables", price: 119.0 },
  { name: "Field Notes Travel Pen", category: "Stationery", price: 32.0 },
  { name: "Field Notes Hardcover", category: "Stationery", price: 24.0 },
  { name: "Field Notes Desk Set", category: "Stationery", price: 58.0 },
  { name: "Drift Cold Brew Maker", category: "Kitchen", price: 89.0 },
  { name: "Drift Pour-Over Kettle", category: "Kitchen", price: 129.0 },
  { name: "Drift Espresso Cups (Set of 4)", category: "Kitchen", price: 48.0 },
  { name: "Trail 30L Backpack", category: "Outdoor", price: 159.0 },
  { name: "Trail Insulated Bottle", category: "Outdoor", price: 39.0 },
  { name: "Trail Camp Chair", category: "Outdoor", price: 99.0 },
];

const ORDER_STATUSES: Array<
  "pending" | "paid" | "shipped" | "refunded" | "cancelled"
> = ["pending", "paid", "paid", "paid", "shipped", "shipped", "refunded", "cancelled"];

const ROLES: Array<"admin" | "manager" | "user"> = ["admin", "manager", "user"];
const STATUSES: Array<"active" | "invited" | "suspended"> = [
  "active",
  "active",
  "active",
  "active",
  "invited",
  "suspended",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // Reset
  await db.execute(sql`TRUNCATE TABLE orders, products, users, session RESTART IDENTITY CASCADE`);

  // Seed session (default role = admin)
  await db
    .insert(sessionTable)
    .values({ id: "default", role: "admin" })
    .onConflictDoNothing();

  // Seed users
  const now = new Date();
  const userRows: Array<typeof usersTable.$inferInsert> = [
    {
      name: "Avery Chen",
      email: "avery.chen@northbeam.io",
      role: "admin",
      status: "active",
      avatarUrl:
        "https://api.dicebear.com/9.x/notionists/svg?seed=Avery&backgroundColor=transparent",
      lastActiveAt: new Date(now.getTime() - randInt(0, 6) * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 200 * DAY_MS),
    },
    {
      name: "Jordan Patel",
      email: "jordan.patel@northbeam.io",
      role: "manager",
      status: "active",
      avatarUrl:
        "https://api.dicebear.com/9.x/notionists/svg?seed=Jordan&backgroundColor=transparent",
      lastActiveAt: new Date(now.getTime() - randInt(0, 12) * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 180 * DAY_MS),
    },
    {
      name: "Sam Rivera",
      email: "sam.rivera@northbeam.io",
      role: "user",
      status: "active",
      avatarUrl:
        "https://api.dicebear.com/9.x/notionists/svg?seed=Sam&backgroundColor=transparent",
      lastActiveAt: new Date(now.getTime() - randInt(0, 24) * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 150 * DAY_MS),
    },
  ];

  // Generate ~45 more users with creation dates spread over ~60 days
  for (let i = 0; i < 45; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    const role = pick(ROLES);
    const status = pick(STATUSES);
    const ageDays = randInt(0, 60);
    userRows.push({
      name,
      email,
      role,
      status,
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name + i)}&backgroundColor=transparent`,
      lastActiveAt:
        status === "active"
          ? new Date(now.getTime() - randInt(0, 14) * DAY_MS)
          : null,
      createdAt: new Date(now.getTime() - ageDays * DAY_MS),
    });
  }

  await db.insert(usersTable).values(userRows);

  // Seed products
  const productRows = PRODUCTS.map((p, i) => ({
    name: p.name,
    sku: `${p.category.slice(0, 3).toUpperCase()}-${(1000 + i).toString()}`,
    category: p.category,
    price: p.price.toString(),
    stock: randInt(3, 120),
    createdAt: new Date(now.getTime() - randInt(30, 240) * DAY_MS),
  }));

  const insertedProducts = await db
    .insert(productsTable)
    .values(productRows)
    .returning();

  // Seed orders — distributed across the last 60 days, with the bulk in the
  // last 30 to keep dashboard charts looking active. Roughly 8-15 per day.
  const allUsers = await db.select().from(usersTable);
  const orderRows: Array<typeof ordersTable.$inferInsert> = [];

  for (let dayOffset = 0; dayOffset <= 59; dayOffset++) {
    const ordersToday = dayOffset <= 29 ? randInt(8, 18) : randInt(3, 9);
    for (let k = 0; k < ordersToday; k++) {
      const product = pick(insertedProducts);
      const customer = pick(allUsers);
      const baseAmount = Number(product.price) * randInt(1, 3);
      const amount = Math.round(baseAmount * 100) / 100;
      const status = pick(ORDER_STATUSES);
      const createdAt = new Date(
        now.getTime() -
          dayOffset * DAY_MS -
          randInt(0, 23) * 60 * 60 * 1000 -
          randInt(0, 59) * 60 * 1000,
      );
      const orderNumber = `ORD-${createdAt.getFullYear()}${String(
        createdAt.getMonth() + 1,
      ).padStart(2, "0")}${String(createdAt.getDate()).padStart(
        2,
        "0",
      )}-${String(orderRows.length + 1).padStart(4, "0")}`;
      orderRows.push({
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        amount: amount.toString(),
        status,
        createdAt,
      });
    }
  }

  await db.insert(ordersTable).values(orderRows);

  // eslint-disable-next-line no-console
  console.log(
    `Seeded: ${userRows.length} users, ${insertedProducts.length} products, ${orderRows.length} orders`,
  );
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
