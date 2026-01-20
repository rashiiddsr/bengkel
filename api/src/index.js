import "dotenv/config";
import cors from "cors";
import crypto from "crypto";
import express from "express";
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
  const { email, password } = req.body ?? {};
  if (!email || !password) {
      return res.status(400).json({ message: "email dan password wajib diisi" });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT id, email, role FROM users WHERE email = ? AND password_hash = SHA2(?, 256)",
      [email, password]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Kredensial tidak valid" });
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
  const { email, password, full_name, phone } = req.body ?? {};
  if (!email || !password || !full_name) {
    return res.status(400).json({ message: "email, password, dan full_name wajib diisi" });
  }

  const userId = crypto.randomUUID();
  try {
    const pool = getPool();
    await pool.query(
      "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, SHA2(?, 256), ?)",
      [userId, email, password, "customer"]
    );
    await pool.query("INSERT INTO profiles (id, full_name, role, phone) VALUES (?, ?, ?, ?)", [
      userId,
      full_name,
      "customer",
      phone || null,
    ]);
    const user = { id: userId, email, role: "customer" };
    const [profileRows] = await pool.query("SELECT * FROM profiles WHERE id = ?", [userId]);
    const profile = profileRows[0] ?? null;
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { user, createdAt: Date.now() });
    setSessionCookie(res, sessionId);
    res.status(201).json({ user, profile });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email sudah terdaftar" });
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
      filters.push("id = ?");
      values.push(req.query.id);
    }
    if (req.query.role) {
      filters.push("role = ?");
      values.push(req.query.role);
    }
    const whereClause = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
    const orderClause = buildOrderClause(req.query.order, ["full_name", "created_at"]);
    const [rows] = await pool.query(`SELECT * FROM profiles${whereClause}${orderClause}`, values);
    res.json(rows);
  } catch (error) {
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
  const { customer_id, make, model, year, license_plate } = req.body ?? {};
  if (!customer_id || !make || !model || !year || !license_plate) {
    return res
      .status(400)
      .json({ message: "customer_id, make, model, year, dan license_plate wajib diisi" });
  }
  try {
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(
      "INSERT INTO vehicles (id, customer_id, make, model, year, license_plate) VALUES (?, ?, ?, ?, ?, ?)",
      [id, customer_id, make, model, year, license_plate]
    );
    const [rows] = await pool.query("SELECT * FROM vehicles WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/vehicles/:vehicleId", async (req, res) => {
  const updates = req.body ?? {};
  const allowed = ["make", "model", "year", "license_plate"];
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
      filters.push("status = ?");
      values.push(req.query.status);
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
    "final_cost",
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

app.listen(port, () => {
  console.log(`API berjalan di http://localhost:${port}`);
});
