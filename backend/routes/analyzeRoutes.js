import express from "express";
import Comment from "../models/comment.js";
import verifyToken from "../middleware/verifyToken.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();



router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { comments, url } = req.body;
    const userId = req.user.id;

    if (!comments || comments.length === 0) {
      return res.status(400).json({ message: "No comments provided" });
    }

    console.log(" Incoming sample comment:", comments[0]);

    const formattedComments = comments.map((c) => ({
      userId,
      username: c.username || "Anonymous",
      text: c.text || "",
      toxicityScore:
        typeof c.toxicity === "number"
          ? c.toxicity
          : typeof c.toxicityScore === "number"
          ? c.toxicityScore
          : 0, 
      url: url || "Unknown URL",
      createdAt: new Date(),
    }));

    const saved = await Comment.insertMany(formattedComments);

    res.status(201).json({
      message: " Comments saved successfully",
      count: saved.length,
    });
  } catch (error) {
    console.error(" Error saving comments:", error);
    res.status(500).json({ message: "Server error while saving comments" });
  }
});



router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await Comment.find({ userId })
      .sort({ analyzedAt: -1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    console.error(" Error fetching history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
