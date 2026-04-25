import { pool, query } from "./db.js";

const FIRST = [
  "Avery", "Jordan", "Sam", "Ada", "Sage", "Skyler", "Yael", "Rowan",
  "Hayden", "Quinn", "Riley", "Taylor", "Morgan", "Casey", "Reese",
  "Ari", "Jamie", "Alex", "Charlie", "Drew", "Emerson", "Finley",
  "Harper", "Indigo", "Jules", "Kendall", "Logan", "Marlowe", "Noa",
  "Oakley", "Parker", "River", "Sutton", "Tatum", "Vesper", "Wren",
  "Zion", "Adair", "Blair", "Cameron", "Dakota", "Eden", "Frankie",
  "Gray", "Lennon", "Phoenix", "Sterling", "Wynn",
];
const LAST = [
  "Chen", "Patel", "Rivera", "Kim", "Reyes", "Ito", "Garcia", "Wozniak",
  "Hayes", "Brooks", "Nguyen", "Adams", "Khan", "Silva", "Bennett",
  "Cole", "Diaz", "Evans", "Foster", "Hall", "Iyer", "Jansen",
];
const PRODUCTS = [
  { name: "Drift Pour-Over Kettle", category: "Kitchen", price: 129 },
  { name: "Trail 30L Backpack", category: "Outdoor", price: 159 },
  { name: "Aurora Throw Blanket", category: "Home", price: 79 },
  { name: "Helio Solar Lantern", category: "Outdoor", price: 64 },
  { name: "Linen Apron", category: "Kitchen", price: 39 },
  { name: "Mesa Ceramic Mug Set", category: "Kitchen", price: 49 },
  { name: "Quartz Desk Lamp", category: "Office", price: 89 },
  { name: "Bramble Wool Socks", category: "Apparel", price: 24 },
  { name: "Cove Wireless Speaker", category: "Electronics", price: 199 },
  { name: "Echo Standing Desk", category: "Office", price: 449 },
  { name: "Field Journal", category: "Stationery", price: 22 },
  { name: "Glacier Insulated Bottle", category: "Outdoor", price: 34 },
  { name: "Harbor Canvas Tote", category: "Apparel", price: 45 },
  { name: "Iris Linen Shirt", category: "Apparel", price: 89 },
  { name: "Juniper Diffuser", category: "Home", price: 56 },
  { name: "Knoll Pour Coffee Beans", category: "Kitchen", price: 18 },
  { name: "Loft Acoustic Panel", category: "Office", price: 72 },
  { name: "Marrow Cast Iron Pan", category: "Kitchen", price: 88 },
];
const STATUSES = ["pending", "paid", "shipped", "refunded", "cancelled"];
const STATUS_WEIGHTS = [0.12, 0.38, 0.27, 0.13, 0.10];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickWeighted(arr, weights) {
  let r = Math.random();
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log("Resetting tables...");
  await query(`DROP TABLE IF EXISTS orders, products, users, session CASCADE`);
  await query(`
    CREATE TABLE IF NOT EXISTS session (
      id text PRIMARY KEY,
      role text NOT NULL,
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      role text NOT NULL,
      status text NOT NULL,
      avatar_url text,
      last_active_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS products (
      id serial PRIMARY KEY,
      name text NOT NULL,
      sku text NOT NULL UNIQUE,
      category text NOT NULL,
      price numeric(10,2) NOT NULL,
      stock integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      order_number text NOT NULL UNIQUE,
      customer_name text NOT NULL,
      customer_email text NOT NULL,
      product_name text NOT NULL,
      product_category text NOT NULL,
      amount numeric(10,2) NOT NULL,
      status text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);
  await query(`TRUNCATE orders, products, users, session RESTART IDENTITY`);

  await query(
    `INSERT INTO session (id, role) VALUES ('default', 'admin')`,
  );

  console.log("Seeding users...");
  const usedEmails = new Set();
  const userNames = [];
  for (let i = 0; i < 48; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `${first} ${last}`;
    const email = `${first}.${last}`.toLowerCase() + `${i}@example.com`;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);
    userNames.push(name);
    const role = i === 0 ? "admin" : i < 6 ? "manager" : "user";
    const status = pickWeighted(["active", "invited", "suspended"], [0.78, 0.16, 0.06]);
    const daysAgo = rand(0, 90);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    await query(
      `INSERT INTO users (name, email, role, status, avatar_url, last_active_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        name,
        email,
        role,
        status,
        `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(first)}&backgroundColor=transparent`,
        createdAt,
        createdAt,
      ],
    );
  }

  console.log("Seeding products...");
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    await query(
      `INSERT INTO products (name, sku, category, price, stock)
       VALUES ($1, $2, $3, $4, $5)`,
      [p.name, `SKU-${1000 + i}`, p.category, p.price, rand(0, 80)],
    );
  }

  console.log("Seeding orders...");
  let orderCount = 0;
  for (let day = 60; day >= 0; day--) {
    const ordersToday = rand(4, 14);
    for (let n = 0; n < ordersToday; n++) {
      orderCount++;
      const product = pick(PRODUCTS);
      const customer = pick(userNames);
      const created = new Date();
      created.setDate(created.getDate() - day);
      created.setHours(rand(8, 22), rand(0, 59));
      const status = pickWeighted(STATUSES, STATUS_WEIGHTS);
      const qty = rand(1, 3);
      const amount = product.price * qty;
      const orderNumber = `ORD-${created.toISOString().slice(0, 10).replace(/-/g, "")}-${String(n + 1).padStart(4, "0")}`;
      const email = customer.toLowerCase().replace(" ", ".") + "@example.com";
      await query(
        `INSERT INTO orders (
           order_number, customer_name, customer_email,
           product_name, product_category, amount, status, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderNumber,
          customer,
          email,
          product.name,
          product.category,
          amount,
          status,
          created,
        ],
      );
    }
  }

  console.log(
    `Seeded: ${userNames.length} users, ${PRODUCTS.length} products, ${orderCount} orders`,
  );
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
