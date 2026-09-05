const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load Environment Variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files Statically
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected Successfully");
    
    // Seed Super Admin if not already present
    try {
      const User = require("./models/User");
      const superAdminExists = await User.findOne({ role: "super_admin" });
      
      if (!superAdminExists) {
        const superAdmin = new User({
          name: "Super Admin",
          phone: "0000000000",
          password: "propretiesisiri",
          role: "super_admin",
        });
        
        await superAdmin.save();
        console.log("Super Admin seeded successfully: Phone: 0000000000 / propretiesisiri");
      } else {
        console.log("Super Admin already exists in the database");
      }
    } catch (err) {
      console.error("Error seeding Super Admin:", err);
    }
  })
  .catch((err) => {
    console.error("MongoDB Connection Failure:", err);
  });

// Register Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/properties", require("./routes/properties"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/superadmin", require("./routes/superadmin"));
app.use("/api/interest", require("./routes/interest"));
app.use("/api/categories", require("./routes/categories"));

// Root route for API verification
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Isiri Properties API" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err.message);
  res.status(500).json({ error: err.message || "An unexpected server error occurred" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
