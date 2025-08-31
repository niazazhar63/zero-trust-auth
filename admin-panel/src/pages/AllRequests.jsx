import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const AllRequests = ({ token }) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [approving, setApproving] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/request/requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.success) {
          setRequests(res.data.data); // store all requests
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token]);

  const handleApprove = async (id) => {
    setApproving(id); // show loading for this ID
    try {
      const res = await axios.put(
        `${backendUrl}/api/request/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("User Approved and email sent");
        setRequests((prev) =>
          prev.map((req) =>
            req._id === id ? { ...req, status: "approved" } : req
          )
        );
      }
    } catch (error) {
      console.error("approved err", error);
      toast.error(error.message);
    } finally {
      setApproving(null); // stop loading
    }
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter((req) => req.status === activeTab);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Requests</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        {["pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <p>Loading requests...</p>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              className="p-4 bg-gray-100 rounded shadow-sm flex justify-between"
            >
              <div>
                <h2 className="font-semibold">Name: {req.name}</h2>
                <p className="text-sm">Email: {req.email}</p>
                <p className="text-sm">Role: {req.role}</p>
                <p className="text-sm">Age: {req.age}</p>
              </div>
              <div className="flex gap-2">
                {activeTab === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(req._id)}
                      disabled={approving === req._id}
                      className={`px-3 py-1 rounded text-white ${
                        approving === req._id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500"
                      }`}
                    >
                      {approving === req._id ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                          Approving...
                        </span>
                      ) : (
                        "Approve"
                      )}
                    </button>

                    <button className="px-3 py-1 bg-red-500 text-white rounded">
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No {activeTab} requests found.</p>
        )}
      </div>
    </div>
  );
};

export default AllRequests;
