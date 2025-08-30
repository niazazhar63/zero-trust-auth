import jwt from "jsonwebtoken";

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
      const token = jwt.sign(
        { email }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1h" }
      );

      return res.status(200).json({ success: true, token });
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default adminLogin;
