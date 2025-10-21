import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#22c55e", "#facc15", "#ef4444"]; // green, yellow, red

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function RiskDistributionChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/admin/analytics/risk-distribution`);
        const formatted = res.data.map(item => ({
          name: item._id,
          value: item.count,
        }));
        setData(formatted);
      } catch (err) {
        console.error("Error fetching risk distribution:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4">
      <h2 className="text-lg font-semibold mb-2 text-gray-800">Risk Level Distribution</h2>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
