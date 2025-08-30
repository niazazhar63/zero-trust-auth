import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["employee", "co-worker", "intern" ],
      default: "co-worker",
    },
    age: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"], // restrict allowed values
      default: "pending", // default value when user is created
    },
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);

export default Request;