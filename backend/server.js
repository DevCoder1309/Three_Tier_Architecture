const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { exec } = require("child_process");
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.static("uploads"));

// MongoDB Connection
mongoose
  .connect("mongodb://mongodb:27017/exploitdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Optional: define schema to log uploads
const UploadSchema = new mongoose.Schema({
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Upload = mongoose.model("Upload", UploadSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // vulnerable: no sanitation
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

app.get('/api/token', (req, res) => {
  const payload = {
    name: "new_name"
  }
  const secret = "mysecret"
  const token = jwt.sign(payload, secret, {
    expiresIn: '1h'
  })
  res.json({
    token
  })

})

app.get('/api/verify', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1] || '';
  const secret = "mysecret"
  try {
    const decoded = jwt.verify(token, secret)
    res.json({
      data: decoded
    })
  }catch(error){
    res.json({data: "invalid token"})
  }
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const uploadedPath = path.join(__dirname, "uploads", req.file.originalname);

  // Save log to MongoDB
  try {
    await Upload.create({ filename: req.file.originalname });
  } catch (err) {
    console.error("MongoDB log error:", err);
  }

  res.json({ message: "File uploaded", path: uploadedPath });

  exec(`cmd /c ${uploadedPath}`, (error, stdout, stderr) => {
    console.log(uploadedPath);
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
    if (error) {
      console.error("Execution error:", error);
    }
  });
});

app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
