const path = require("path");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 3000;
const url = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
let bookings;

app.use(cors());
app.use(express.json());

// Returns clean values, or null when any field is invalid
function readBooking(body) {
  const { visitorName, mobile, category, date, status, fee } = body;
  const fields = [visitorName, mobile, category, date, status];
  if (fields.some((value) => typeof value !== "string")) return null;
  if (!/^[A-Za-z ]+$/.test(visitorName.trim())) return null;
  if (!/^\d{10}$/.test(mobile)) return null;
  if (!category || !status) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^\d{1,6}$/.test(String(fee))) return null;
  return { visitorName: visitorName.trim(), mobile, category, date, status, fee: Number(fee) };
}

// READ all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const records = await bookings.find({}).sort({ date: 1 }).toArray();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch tour bookings" });
  }
});

// CREATE a booking
app.post("/api/bookings", async (req, res) => {
  try {
    const booking = readBooking(req.body);
    if (!booking) {
      return res.status(400).json({ error: "Enter valid tour booking details" });
    }
    const result = await bookings.insertOne(booking);
    res.status(201).json({ message: "Tour booked successfully", insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Unable to book tour" });
  }
});

// UPDATE a booking
app.put("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    const booking = readBooking(req.body);
    if (!booking) {
      return res.status(400).json({ error: "Enter valid tour booking details" });
    }
    const result = await bookings.updateOne({ _id: new ObjectId(id) }, { $set: booking });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json({ message: "Tour updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Unable to update tour" });
  }
});

// DELETE a booking
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    const result = await bookings.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json({ message: "Tour deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete tour" });
  }
});

// Serve the built React frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));

async function startServer() {
  try {
    await client.connect();
    const db = client.db("TourismGuideDB");
    bookings = db.collection("bookings");
    app.listen(PORT, () => {
      console.log("LOCALTRAILS WEBSITE STARTED");
      console.log(`Website: http://localhost:${PORT}`);
      console.log("MongoDB Connected Successfully");
    });
  } catch (error) {
    console.error("Database Connection Error:", error.message);
    process.exit(1);
  }
}

startServer();
