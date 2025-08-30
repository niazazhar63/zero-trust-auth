import Request from "../models/requestModel.js";

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


