import express from "express";
import { db, save } from "./db.js";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const round2 = (n) => Math.round(n * 100) / 100;

/* ================= Health ================= */
app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "octarine-api", ts: Date.now() }),
);

/* ================= Catalog ================= */
app.get("/api/products", (req, res) => {
  const { cat } = req.query;
  const list = cat && cat !== "all" ? db.products.filter((p) => p.cat === cat) : db.products;
  res.json({ items: list, total: list.length });
});

app.get("/api/products/:id", (req, res) => {
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "not_found" });
  res.json(p);
});

app.post("/api/admin/products", (req, res) => {
  const p = { id: `prd_${Date.now()}`, ...req.body, stock: req.body.stock ?? 0 };
  db.products.push(p);
  save(db);
  res.status(201).json(p);
});

app.put("/api/admin/products/:id", (req, res) => {
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "not_found" });
  Object.assign(p, req.body, { id: p.id });
  save(db);
  res.json(p);
});

app.delete("/api/admin/products/:id", (req, res) => {
  const i = db.products.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "not_found" });
  db.products.splice(i, 1);
  save(db);
  res.json({ ok: true });
});

/* ================= Orders / check generation ================= */
app.post("/api/orders", (req, res) => {
  const { items, customer } = req.body;
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "bad_items" });
  const order = {
    id: `ord_${Date.now()}`,
    items: items.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price })),
    total: round2(items.reduce((s, i) => s + i.price * i.qty, 0)),
    customer: customer || { name: "Гость", phone: "" },
    status: "new",
    createdAt: new Date().toISOString(),
    check: {
      number: 1000 + db.orders.length + 1,
      issuedAt: new Date().toISOString(),
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total: round2(items.reduce((s, i) => s + i.price * i.qty, 0)),
      payment: "card",
      cafe: "Octarine",
    },
  };
  db.orders.push(order);
  save(db);
  res.status(201).json(order);
});

app.get("/api/orders", (req, res) => {
  const list = [...db.orders].reverse();
  res.json({ items: list, total: list.length });
});

app.get("/api/orders/:id", (req, res) => {
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: "not_found" });
  res.json(o);
});

app.patch("/api/orders/:id/status", (req, res) => {
  const o = db.orders.find((x) => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: "not_found" });
  o.status = req.body.status || o.status;
  save(db);
  res.json(o);
});

/* ================= Blog ================= */
app.get("/api/posts", (req, res) => res.json({ items: [...db.posts].reverse() }));

app.post("/api/posts", (req, res) => {
  const p = {
    id: `post_${Date.now()}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().slice(0, 10),
  };
  db.posts.push(p);
  save(db);
  res.status(201).json(p);
});

app.put("/api/posts/:id", (req, res) => {
  const p = db.posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "not_found" });
  Object.assign(p, req.body, { id: p.id });
  save(db);
  res.json(p);
});

app.delete("/api/posts/:id", (req, res) => {
  const i = db.posts.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "not_found" });
  db.posts.splice(i, 1);
  save(db);
  res.json({ ok: true });
});

/* ================= Auth ================= */
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "bad_request" });
  const user = { id: Date.now(), name, email, password, role: "user" };
  db.users.push(user);
  save(db);
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "bad_credentials" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get("/api/auth/me", (req, res) =>
  res.json({ ok: true, user: { id: 1, name: "Admin", email: "admin@octarine.ru", role: "admin" } }),
);

/* ================= Admin / stats ================= */
app.get("/api/admin/stats", (req, res) => {
  const revenue = db.orders.reduce((s, o) => s + o.total, 0);
  const sold = {};
  db.orders.forEach((order) =>
    order.items.forEach((item) => {
      const current = sold[item.productId] || { id: item.productId, qty: 0, revenue: 0 };
      current.qty += item.qty;
      current.revenue = round2(current.revenue + item.price * item.qty);
      sold[item.productId] = current;
    }),
  );
  const topProducts = Object.values(sold)
    .map((item) => ({ ...item, name: db.products.find((p) => p.id === item.id)?.name || item.id }))
    .sort((a, b) => b.revenue - a.revenue);
  const byCategory = Object.values(
    db.products.reduce((acc, product) => {
      const key = product.cat;
      acc[key] = acc[key] || { id: key, revenue: 0 };
      acc[key].revenue += sold[product.id]?.revenue || 0;
      return acc;
    }, {}),
  ).map((item) => ({ id: item.id, revenue: round2(item.revenue) }));
  res.json({
    revenue: round2(revenue),
    ordersCount: db.orders.length,
    avgCheck: db.orders.length ? round2(revenue / db.orders.length) : 0,
    topProducts,
    byCategory,
  });
});

/* ================= Start ================= */
app.listen(4545, () => console.log("☕ Octarine API → http://localhost:4545"));
