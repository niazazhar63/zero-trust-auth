import { BrowserRouter, Route, Routes } from "react-router-dom"
import RequestAccess from "./pages/RequestAccess"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
function App() {

  return (
    <Routes>
      <Route path="/" element={<LandingPage />}> </Route>
      <Route path="/login" element={<LoginPage />}> </Route>
      <Route path="/request" element={<RequestAccess />}> </Route>
    </Routes>
  )
}

export default App
