import { BrowserRouter, Route, Routes } from "react-router-dom";
import RequestAccess from "./pages/RequestAccess";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Link1 from "./pages/Links/Link1";
import Link2 from "./pages/Links/Link2";
import Link3 from "./pages/Links/Link3";
import AuthProvider from "./context/AuthProvider";

function App() {
  return (
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request" element={<RequestAccess />} />
          <Route path="/link1" element={<Link1 />} />
          <Route path="/link2" element={<Link2 />} />
          <Route path="/link3" element={<Link3 />} />
        </Routes>
      </AuthProvider>
  );
}

export default App;
