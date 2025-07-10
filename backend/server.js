const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { exec } = require("child_process");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json()); // For parsing JSON bodies (needed for login/register)
app.use(express.static("uploads"));

// ==============================
// MongoDB Connection
// ==============================
mongoose
  .connect("mongodb://mongodb:27017/exploitdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// Upload Logging Schema
// ==============================
const UploadSchema = new mongoose.Schema({
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Upload = mongoose.model("Upload", UploadSchema);

// ==============================
// User Schema for Login/Register
// ==============================
const UserSchema = new mongoose.Schema({
  username: String,
  password: String, // ⚠️ plaintext for now (hashing later)
});
const User = mongoose.model("User", UserSchema);

// ==============================
// Multer File Storage (vulnerable)
// ==============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // ⚠️ vulnerable: no filename sanitation
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"), false);
    }
  },
});

// ==============================
// Routes
// ==============================

// 1. Upload Route (already existing)

app.get("/api/token", (req, res) => {
  const payload = {
    name: "new_name",
  };
  const secret = "mysecret";
  const token = jwt.sign(payload, secret, {
    expiresIn: "1h",
  });
  res.json({
    token,
  });
});

app.get("/api/verify", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1] || "";
  const secret = "mysecret";
  try {
    const decoded = jwt.verify(token, secret);
    res.json({
      data: decoded,
    });
  } catch (error) {
    res.json({ data: "invalid token" });
  }
});


app.post("/upload", upload.single("file"), async (req, res) => {
  const uploadedPath = path.join(__dirname, "uploads", req.file.originalname);

  // Save upload log
  try {
    await Upload.create({ filename: req.file.originalname });
  } catch (err) {
    console.error("MongoDB log error:", err);
  }

  res.json({ message: "File uploaded", path: uploadedPath });

  // Simulate execution (deliberately vulnerable)
  exec(`cmd /c ${uploadedPath}`, (error, stdout, stderr) => {
    console.log("Executed:", uploadedPath);
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
    if (error) {
      console.error("Execution error:", error);
    }
  });
});

// 2. Register Route
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });

  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  await User.create({ username, password }); // ⚠️ Store securely in real apps
  res.json({ message: "Registered successfully" });
});

// 3. Login Route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (user) {
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// ==============================
// Start Server
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server started on http://localhost:5000");
});
