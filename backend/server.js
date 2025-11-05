import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import analyzeRouter from "./routes/analyze.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API route
app.use("/api/analyze", analyzeRouter);

// --------------------
// Serve Vite frontend build (dist folder)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// For any route not handled by backend API, send back index.html
// Use '/*' instead of '*' to correctly match all paths
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
});

// --------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
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
