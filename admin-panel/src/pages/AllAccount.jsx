import React, { useEffect, useState } from "react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const AllAccount = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/admin/getAllUsers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete user by UID
  const deleteUser = async (email) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${backendUrl}/api/admin/deleteUser/${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers((prev) => prev.filter((user) => user.email !== email));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Accounts</h2>
      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>UID</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {user.displayName || "N/A"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {user.email}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {user.uid}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <button
                    onClick={() => deleteUser(user.email)}
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AllAccount;
