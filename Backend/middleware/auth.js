import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.email || decoded.email !== process.env.ADMIN_EMAIL)
      return res.status(403).json({ success: false, message: "Forbidden: Not admin" });

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};