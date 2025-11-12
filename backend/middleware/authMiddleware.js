import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];
  
  console.log("[authMiddleware] Authorization header:", authHeader);
  console.log("[authMiddleware] raw token:", token);

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    console.log("[authMiddleware] decoded token:", verified);
    req.user = verified;
    next();
  } catch (err) {
    console.error("[authMiddleware] token verification failed:", err && err.message);
    res.status(400).json({ message: "Invalid token." });
  }
};
