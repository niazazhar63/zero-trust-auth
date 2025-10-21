import LoginTrendChart from "../components/LoginTrendChart";
import RiskDistributionChart from "../components/RiskDistributionChart";

export default function Analytics() {
  return (
    <div className="p-6 grid md:grid-cols-2 gap-6">
      <RiskDistributionChart />
      <LoginTrendChart />
    </div>
  );
}
