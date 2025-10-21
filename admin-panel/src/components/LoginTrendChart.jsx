import { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function LoginTrendChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/admin/analytics/login-trend`);
        const formatted = res.data.map(item => ({
          date: item._id,
          count: item.count,
        }));
        setData(formatted);
      } catch (err) {
        console.error("Error fetching login trend:", err);
      }
    };
    fetchTrend();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mt-6">
      <h2 className="text-lg font-semibold mb-2 text-gray-800">Login Attempts Over Time</h2>
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
