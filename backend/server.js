import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import analyzeRouter from "./routes/analyze.js";
import authRouter from "./routes/authrouter.js";

dotenv.config();

import mongoose from "mongoose";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected successfully"))
  .catch((err) => console.error(" MongoDB connection error:", err));

const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/auth", authRouter);


app.use("/api/analyze", analyzeRouter);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, "../frontend/dist")));


app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});



















// // server.js
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import analyzeRouter from "./routes/analyze.js";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());


// app.use("/api/analyze", analyzeRouter);


// app.get("/", (req, res) => {
//   res.send("✅ Backend is running successfully!");
// });


// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Backend running on http://localhost:${PORT}`);
// });
