import mongoose from "mongoose";
import { type } from "os";

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },

  text: String,
  username: String,
  toxicityScore: {type: Number, default: 0},
  url: { type: String },
  analyzedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Comment", commentSchema);