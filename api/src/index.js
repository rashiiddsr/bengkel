import "dotenv/config";
import cors from "cors";
import express from "express";
import { getPool } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/service-requests", async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT id, vehicle_id, status, service_type, created_at FROM service_requests ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/service-requests", async (req, res) => {
  const { vehicle_id, service_type, status } = req.body;

  if (!vehicle_id || !service_type) {
    return res.status(400).json({ message: "vehicle_id and service_type are required" });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      "INSERT INTO service_requests (vehicle_id, service_type, status) VALUES (?, ?, ?)",
      [vehicle_id, service_type, status || "pending"]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
