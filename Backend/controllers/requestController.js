import Request from "../models/requestModel.js";
import { provisionUserAndEmail } from "../services/provisionService.js";
import { sendRejectionEmail } from "../utils/rejectEmail.js";

export const createRequest = async (req, res) => {
  try {
    const { name, email, role, age } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and Email are required" });
    }

    const existingRequest = await Request.findOne({ email });
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Request all ready Submitted with this email" });
    }

    const newRequest = new Request({ name, email, role, age });
    const savedRequest = await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Request Submitted successfully",
      data: savedRequest,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Serer error. Please try again later.",
    });
  }
};

// Get requests based on status
export const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// approve a request
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    //1 finding out the request
    const userRequest = await Request.findById(id);
    if (!userRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    // 2 firebase user creation and email sending
    await provisionUserAndEmail({
      email: userRequest.email,
      displayName: userRequest.name,
    });

    userRequest.status = "approved";
    await userRequest.save();

    res.json({ success: true, message: "User approved and email send" });
  } catch (error) {
    console.error("Approve Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// reject a request
export const rejectRequest = async (req, res) => {
  try {
    const userRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!userRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Optionally send a rejection email here
    await sendRejectionEmail( userRequest.email);

    res.json({ success: true, message: "User rejected", data: userRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
