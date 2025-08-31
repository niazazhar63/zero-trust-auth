import { provisionUserAndEmail } from "../services/provisionService.js";

export const testProvision = async (req, res) => {
  try {
    const { email, displayName } = req.body;
    console.log(email)
    if (!email) {
      return res.status(400).json({ success: false, message: "email required" });
    }
    const result = await provisionUserAndEmail({ email, displayName });
    console.log(email)
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Provision error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
