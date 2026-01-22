import "dotenv/config";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import { getPool } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const sessionCookieName = "autoservice_session";
const sessions = new Map();
const isProduction = process.env.NODE_ENV === "production";
const cookieSameSite = process.env.COOKIE_SAMESITE || (isProduction ? "None" : "Lax");
const cookieSecureRaw = process.env.COOKIE_SECURE;
const cookieSecure =
  cookieSecureRaw !== undefined
    ? cookieSecureRaw === "true"
    : isProduction || cookieSameSite.toLowerCase() === "none";
const sessionMaxAge = Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 7);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.resolve(__dirname, "../images");

await fs.promises.mkdir(imagesDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, imagesDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("File harus berupa gambar"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Tidak diizinkan oleh CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/images", express.static(imagesDir));

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};

const setSessionCookie = (res, sessionId) => {
  const cookie = [
    `${sessionCookieName}=${encodeURIComponent(sessionId)}`,
    "HttpOnly",
    "Path=/",
    `SameSite=${cookieSameSite}`,
    cookieSecure ? "Secure" : null,
    sessionMaxAge ? `Max-Age=${sessionMaxAge}` : null,
  ].filter(Boolean);
  res.setHeader("Set-Cookie", cookie.join("; "));
};

const clearSessionCookie = (res) => {
  const cookie = [
    `${sessionCookieName}=`,
    "HttpOnly",
    "Path=/",
    `SameSite=${cookieSameSite}`,
    cookieSecure ? "Secure" : null,
    "Max-Age=0",
  ].filter(Boolean);
  res.setHeader("Set-Cookie", cookie.join("; "));
};

const getSession = (req) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[sessionCookieName];
  if (!sessionId) return null;
  return sessions.get(sessionId) ?? null;
};

const buildOrderClause = (order, allowedFields) => {
  if (!order) return "";
  const [field, directionRaw] = order.split(".");
  if (!allowedFields.includes(field)) return "";
  const direction = directionRaw?.toLowerCase() === "desc" ? "DESC" : "ASC";
  return ` ORDER BY ${field} ${direction}`;
};

const normalizeIncludes = (includeParam) => {
  if (!includeParam) return new Set();
  return new Set(
    String(includeParam)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
};

app.get("/health", async (_req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/uploads", (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "File gambar wajib diunggah" });
    }
    res.status(201).json({ path: `/images/${req.file.filename}` });
  });
});

app.get("/auth/session", async (req, res) => {
  try {
    const session = getSession(req);
    if (!session) {
      return res.json({ user: null, profile: null });
    }
    const pool = getPool();
    const [profileRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [session.user.id]);
    res.json({ user: session.user, profile: profileRows[0] ?? null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { identifier, email, username, password } = req.body ?? {};
  const loginValue = identifier || email || username;
  if (!loginValue || !password) {
    return res.status(400).json({ message: "username/email dan password wajib diisi" });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, username, email, role, is_active
      FROM users
      WHERE (email = ? OR username = ?) AND password_hash = SHA2(?, 256)`,
      [loginValue, loginValue, password]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Kredensial tidak valid" });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: "Akun tidak aktif" });
    }

    const [profileRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [user.id]);
    const profile = profileRows[0] ?? null;
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { user, createdAt: Date.now() });
    setSessionCookie(res, sessionId);
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/auth/register", async (req, res) => {
  const { email, username, password, full_name, phone, address } = req.body ?? {};
  if (!email || !username || !password || !full_name || !phone) {
    return res
      .status(400)
      .json({ message: "email, username, password, full_name, dan phone wajib diisi" });
  }

  const userId = crypto.randomUUID();
  try {
    const pool = getPool();
    await pool.query(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, SHA2(?, 256), ?)",
      [userId, username, email, password, "customer"]
    );
    await pool.query("INSERT INTO profiles (id, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?)", [
      userId,
      full_name,
      "customer",
      phone,
      address || null,
    ]);
    const user = { id: userId, username, email, role: "customer" };
    const [profileRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [userId]);
    const profile = profileRows[0] ?? null;
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { user, createdAt: Date.now() });
    setSessionCookie(res, sessionId);
    res.status(201).json({ user, profile });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email atau username sudah terdaftar" });
    }
    res.status(500).json({ message: error.message });
  }
});

app.post("/auth/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[sessionCookieName];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  clearSessionCookie(res);
  res.status(204).send();
});

app.get("/profiles", async (req, res) => {
  try {
    const pool = getPool();
    const filters = [];
    const values = [];
    if (req.query.id) {
      filters.push("profiles.id = ?");
      values.push(req.query.id);
    }
    if (req.query.role) {
      filters.push("profiles.role = ?");
      values.push(req.query.role);
    }
    if (req.query.active !== undefined) {
      const isActive = String(req.query.active).toLowerCase() === "true" || req.query.active === "1";
      filters.push("users.is_active = ?");
      values.push(isActive ? 1 : 0);
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["full_name", "created_at"]);
    const [rows] = await pool.query(
      `SELECT profiles.*, users.email AS email, users.username AS username, users.is_active AS is_active
      FROM profiles
      INNER JOIN users ON users.id = profiles.id${whereClause}${orderClause}`,
      values
    );
    const response = rows.map((row) => ({
      ...row,
      is_active: Boolean(row.is_active),
    }));
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/profiles/:id", async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, address, avatar_url } = req.body ?? {};

  if (full_name === undefined && phone === undefined && address === undefined && avatar_url === undefined) {
    return res.status(400).json({ message: "Tidak ada data yang diperbarui" });
  }

  try {
    const pool = getPool();
    const fields = [];
    const values = [];

    if (full_name !== undefined) {
      fields.push("full_name = ?");
      values.push(full_name);
    }
    if (phone !== undefined) {
      fields.push("phone = ?");
      values.push(phone);
    }
    if (address !== undefined) {
      fields.push("address = ?");
      values.push(address);
    }
    if (avatar_url !== undefined) {
      fields.push("avatar_url = ?");
      values.push(avatar_url);
    }

    values.push(id);
    await pool.query(`UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [id]);
    res.json(rows[0] ?? null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { email, username, password, is_active } = req.body ?? {};

  if (email === undefined && username === undefined && password === undefined && is_active === undefined) {
    return res.status(400).json({ message: "Tidak ada data yang diperbarui" });
  }

  try {
    const pool = getPool();
    const fields = [];
    const values = [];

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }
    if (username !== undefined) {
      fields.push("username = ?");
      values.push(username);
    }
    if (password !== undefined) {
      fields.push("password_hash = SHA2(?, 256)");
      values.push(password);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT id, username, email, role, is_active FROM users WHERE id = ?", [id]);
    res.json(rows[0] ?? null);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email atau username sudah terdaftar" });
    }
    res.status(500).json({ message: error.message });
  }
});

app.post("/mechanics", async (req, res) => {
  const { email, username, password, full_name, phone, address } = req.body ?? {};
  if (!email || !username || !password || !full_name) {
    return res.status(400).json({ message: "email, username, password, dan full_name wajib diisi" });
  }

  const userId = crypto.randomUUID();
  try {
    const pool = getPool();
    await pool.query(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, SHA2(?, 256), ?)",
      [userId, username, email, password, "mechanic"]
    );
    await pool.query("INSERT INTO profiles (id, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?)", [
      userId,
      full_name,
      "mechanic",
      phone || null,
      address || null,
    ]);
    const [profileRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [userId]);
    res.status(201).json(profileRows[0] ?? null);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email atau username sudah terdaftar" });
    }
    res.status(500).json({ message: error.message });
  }
});

app.get("/service-types", async (req, res) => {
  try {
    const pool = getPool();
    const filters = [];
    const values = [];
    if (req.query.active !== undefined) {
      const isActive = String(req.query.active).toLowerCase() === "true" || req.query.active === "1";
      filters.push("is_active = ?");
      values.push(isActive ? 1 : 0);
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["name", "created_at"]);
    const [rows] = await pool.query(`SELECT * FROM service_types${whereClause}${orderClause}`, values);
    const response = rows.map((row) => ({
      ...row,
      is_active: Boolean(row.is_active),
    }));
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/service-types", async (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name) {
    return res.status(400).json({ message: "nama layanan wajib diisi" });
  }
  try {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query("INSERT INTO service_types (id, name, description) VALUES (?, ?, ?)", [
      id,
      name,
      description || null,
    ]);
    const [rows] = await pool.query("SELECT * FROM service_types WHERE id = ?", [id]);
    const row = rows[0] ?? null;
    res.status(201).json(row ? { ...row, is_active: Boolean(row.is_active) } : null);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama layanan sudah terdaftar" });
    }
    res.status(500).json({ message: error.message });
  }
});

app.patch("/service-types/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body ?? {};

  if (name === undefined && description === undefined && is_active === undefined) {
    return res.status(400).json({ message: "Tidak ada data yang diperbarui" });
  }

  try {
    const pool = getPool();
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    values.push(id);
    await pool.query(`UPDATE service_types SET ${fields.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM service_types WHERE id = ?", [id]);
    const row = rows[0] ?? null;
    res.json(row ? { ...row, is_active: Boolean(row.is_active) } : null);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama layanan sudah terdaftar" });
    }
    res.status(500).json({ message: error.message });
  }
});

app.get("/vehicles", async (req, res) => {
  try {
    const pool = getPool();
    const filters = [];
    const values = [];
    if (req.query.customer_id) {
      filters.push("vehicles.customer_id = ?");
      values.push(req.query.customer_id);
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["created_at", "make", "model"]);
    const include = normalizeIncludes(req.query.include);
    if (include.has("customer")) {
      const [rows] = await pool.query(
        `SELECT vehicles.*, profiles.id AS customer_id,
        profiles.full_name AS customer_full_name,
        profiles.role AS customer_role,
        profiles.phone AS customer_phone,
        profiles.address AS customer_address
        FROM vehicles
        LEFT JOIN profiles ON profiles.id = vehicles.customer_id${whereClause}${orderClause}`,
        values
      );
      const response = rows.map((row) => ({
        id: row.id,
        customer_id: row.customer_id,
        make: row.make,
        model: row.model,
        year: row.year,
        license_plate: row.license_plate,
        photo_url: row.photo_url,
        created_at: row.created_at,
        customer: row.customer_full_name
          ? {
              id: row.customer_id,
              full_name: row.customer_full_name,
              role: row.customer_role,
              phone: row.customer_phone,
              address: row.customer_address,
            }
          : null,
      }));
      return res.json(response);
    }

    const [rows] = await pool.query(`SELECT * FROM vehicles${whereClause}${orderClause}`, values);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/vehicles", async (req, res) => {
  const { customer_id, make, model, year, license_plate, photo_url } = req.body ?? {};
  if (!customer_id || !make || !model || !year || !license_plate) {
    return res
      .status(400)
      .json({ message: "customer_id, make, model, year, dan license_plate wajib diisi" });
  }
  try {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO vehicles (id, customer_id, make, model, year, license_plate, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, customer_id, make, model, year, license_plate, photo_url ?? null]
    );
    const [rows] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/vehicles/:vehicleId", async (req, res) => {
  const updates = req.body ?? {};
  const allowed = ["make", "model", "year", "license_plate", "photo_url"];
  const fields = Object.keys(updates).filter((field) => allowed.includes(field));
  if (fields.length === 0) {
    return res.status(400).json({ message: "Tidak ada field yang valid untuk diperbarui" });
  }

  try {
    const pool = getPool();
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);
    values.push(req.params.vehicleId);
    await pool.query(`UPDATE vehicles SET ${setClause} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [req.params.vehicleId]);
    res.json(rows[0] ?? null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/vehicles/:vehicleId", async (req, res) => {
  try {
    const pool = getPool();
    const [serviceRows] = await pool.query(
      "SELECT id FROM service_requests WHERE vehicle_id = ? LIMIT 1",
      [req.params.vehicleId]
    );
    if (serviceRows.length > 0) {
      return res
        .status(409)
        .json({ message: "Kendaraan tidak bisa dihapus karena sudah memiliki riwayat servis." });
    }
    await pool.query("DELETE FROM vehicles WHERE id = ?", [req.params.vehicleId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/service-requests", async (req, res) => {
  try {
    const pool = getPool();
    const filters = [];
    const values = [];
    if (req.query.customer_id) {
      filters.push("customer_id = ?");
      values.push(req.query.customer_id);
    }
    if (req.query.assigned_mechanic_id) {
      filters.push("assigned_mechanic_id = ?");
      values.push(req.query.assigned_mechanic_id);
    }
    if (req.query.status) {
      const statusValues = String(req.query.status)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (statusValues.length > 1) {
        filters.push(`status IN (${statusValues.map(() => "?").join(", ")})`);
        values.push(...statusValues);
      } else if (statusValues.length === 1) {
        filters.push("status = ?");
        values.push(statusValues[0]);
      }
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["created_at", "status"]);
    const [rows] = await pool.query(`SELECT * FROM service_requests${whereClause}${orderClause}`, values);
    const include = normalizeIncludes(req.query.include);
    if (include.size === 0) {
      return res.json(rows);
    }

    const response = await Promise.all(
      rows.map(async (row) => {
        const item = { ...row };
        if (include.has("customer")) {
          const [customerRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [row.customer_id]);
          item.customer = customerRows[0] ?? null;
        }
        if (include.has("mechanic") && row.assigned_mechanic_id) {
          const [mechanicRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [row.assigned_mechanic_id]);
          item.mechanic = mechanicRows[0] ?? null;
        }
        if (include.has("vehicle")) {
          const [vehicleRows] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [row.vehicle_id]);
          item.vehicle = vehicleRows[0] ?? null;
        }
        return item;
      })
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/service-requests", async (req, res) => {
  const { customer_id, vehicle_id, service_type, description, preferred_date, status } = req.body ?? {};

  if (!customer_id || !vehicle_id || !service_type) {
    return res
      .status(400)
      .json({ message: "customer_id, vehicle_id, dan service_type wajib diisi" });
  }

  try {
    const pool = getPool();
    const [typeRows] = await pool.query("SELECT id FROM service_types WHERE name = ? AND is_active = 1", [
      service_type,
    ]);
    if (typeRows.length === 0) {
      return res.status(400).json({ message: "Jenis layanan tidak tersedia" });
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO service_requests
      (id, customer_id, vehicle_id, service_type, description, preferred_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        customer_id,
        vehicle_id,
        service_type,
        description || null,
        preferred_date || null,
        status || "pending",
      ]
    );

    const [rows] = await pool.query("SELECT * FROM service_requests WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/service-requests/:requestId", async (req, res) => {
  const updates = req.body ?? {};
  const allowed = [
    "status",
    "assigned_mechanic_id",
    "estimated_cost",
    "down_payment",
    "total_cost",
    "payment_method",
    "admin_notes",
    "mechanic_notes",
    "description",
    "preferred_date",
  ];
  const fields = Object.keys(updates).filter((field) => allowed.includes(field));
  if (fields.length === 0) {
    return res.status(400).json({ message: "Tidak ada field yang valid untuk diperbarui" });
  }

  try {
    const pool = getPool();
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);
    values.push(req.params.requestId);
    await pool.query(`UPDATE service_requests SET ${setClause} WHERE id = ?`, values);
    const [rows] = await pool.query("SELECT * FROM service_requests WHERE id = ?", [req.params.requestId]);
    res.json(rows[0] ?? null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/status-history", async (req, res) => {
  try {
    const pool = getPool();
    const filters = [];
    const values = [];
    if (req.query.service_request_id) {
      filters.push("service_request_id = ?");
      values.push(req.query.service_request_id);
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["created_at", "status"]);
    const [rows] = await pool.query(`SELECT * FROM status_history${whereClause}${orderClause}`, values);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/status-history", async (req, res) => {
  const { service_request_id, status, notes, changed_by } = req.body ?? {};
  if (!service_request_id || !status || !changed_by) {
    return res
      .status(400)
      .json({ message: "service_request_id, status, dan changed_by wajib diisi" });
  }
  try {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO status_history (id, service_request_id, status, notes, changed_by) VALUES (?, ?, ?, ?, ?)",
      [id, service_request_id, status, notes || null, changed_by]
    );
    const [rows] = await pool.query("SELECT * FROM status_history WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/service-progress", async (req, res) => {
  try {
    const pool = getPool();
    const filters = [];
    const values = [];
    if (req.query.service_request_id) {
      filters.push("service_request_id = ?");
      values.push(req.query.service_request_id);
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["created_at", "progress_date"]);
    const [rows] = await pool.query(`SELECT * FROM service_progress${whereClause}${orderClause}`, values);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/service-progress", async (req, res) => {
  const { service_request_id, progress_date, description, created_by } = req.body ?? {};
  if (!service_request_id || !progress_date || !description || !created_by) {
    return res.status(400).json({
      message: "service_request_id, progress_date, description, dan created_by wajib diisi",
    });
  }
  try {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO service_progress (id, service_request_id, progress_date, description, created_by) VALUES (?, ?, ?, ?, ?)",
      [id, service_request_id, progress_date, description, created_by]
    );
    const [rows] = await pool.query("SELECT * FROM service_progress WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/service-photos", async (req, res) => {
  const { service_request_id, service_progress_id, photo_url, description, uploaded_by } = req.body ?? {};
  if (!service_request_id || !photo_url || !uploaded_by) {
    return res.status(400).json({
      message: "service_request_id, photo_url, dan uploaded_by wajib diisi",
    });
  }
  try {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO service_photos
        (id, service_request_id, service_progress_id, photo_url, description, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        service_request_id,
        service_progress_id || null,
        photo_url,
        description || null,
        uploaded_by,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM service_photos WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`API berjalan di http://localhost:${port}`);
});
