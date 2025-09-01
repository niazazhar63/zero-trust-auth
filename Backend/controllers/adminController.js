import jwt from "jsonwebtoken";
import Request from "../models/requestModel.js";
import { provisionUserAndEmail } from "../services/provisionService.js";
import { firebaseAuth } from "../config/firebase.js";

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASS
    ) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({ success: true, token });
    }

    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const adminCreateUser = async (req, res) => {
  try {
    const { name, email, age, role } = req.body;

    // 1️⃣ Save user info in Request collection
    const request = await Request.create({
      name,
      email,
      age,
      role,
      status: "approved",
    });

    // 2️⃣ Create Firebase user & send reset password email
    const { uid, resetLink } = await provisionUserAndEmail({
      email,
      displayName: name,
    });

    // 3️⃣ Send success response
    return res.status(201).json({
      success: true,
      message: "User created successfully and password email sent.",
      data: {
        requestId: request._id,
        uid,
        email,
        name,
        role,
        resetLink, // optional: useful for testing only
      },
    });
  } catch (error) {
    console.error("Admin create user error:", error);

    // Handle known Firebase error
    if (error.code === "auth/email-already-exists") {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists in Firebase." });
    }

    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const listAllUsers = async (nextPageToken) => {
      return await firebaseAuth.listUsers(100, nextPageToken);
    };

    let users = [];
    let result = await listAllUsers();

    // প্রথম ব্যাচ যোগ করা
    users = users.concat(result.users);

    // যদি পরবর্তী পেজ থাকে, সব লুপ করে নিয়ে আসা
    while (result.pageToken) {
      result = await listAllUsers(result.pageToken);
      users = users.concat(result.users);
    }

    // রেসপন্স পাঠানো
    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        disabled: u.disabled,
        metadata: u.metadata,
        customClaims: u.customClaims || {},
      })),
    });
  } catch (error) {
    console.error("get users error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await firebaseAuth.deleteUser(req.params.uid);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default adminLogin;
