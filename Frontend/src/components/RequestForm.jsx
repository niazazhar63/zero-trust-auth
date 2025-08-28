import React, { useState } from "react";

const RequestForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    age: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    // You can send formData to your backend here
  };

  return (
    <form onSubmit={handleSubmit} className="border-gray-300 rounded-xl border p-6 flex mx-auto flex-col gap-4 max-w-md">
      {/* Name */}
      <div className="flex flex-col">
        <label htmlFor="name" className="font-medium">Name:</label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          className="border-gray-300 border p-2 rounded"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col">
        <label htmlFor="email" className="font-medium">Email:</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className="border-gray-300 border p-2 rounded"
        />
      </div>

      {/* Role */}
      <div className="flex flex-col">
        <label htmlFor="role" className="font-medium">Role:</label>
        <select
          name="role"
          id="role"
          value={formData.role}
          onChange={handleChange}
          className="border-gray-300 border p-2 rounded"
        >
          <option value="employee">Employee</option>
          <option value="worker">Co-Worker</option>
          <option value="admin">Intern</option>
        </select>
      </div>

      {/* Age */}
      <div className="flex flex-col">
        <label htmlFor="age" className="font-medium">Age:</label>
        <input
          type="number"
          name="age"
          id="age"
          value={formData.age}
          onChange={handleChange}
          placeholder="Enter your age"
          className="border-gray-300 border p-2 rounded"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="bg-[#A3DC9A] hover:bg-[#8CC983] text-white p-2 rounded transition"
      >
        Submit
      </button>
    </form>
  );
};

export default RequestForm;
