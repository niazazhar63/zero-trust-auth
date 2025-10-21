import "./App.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import AllRequests from "./pages/AllRequests";
import Add from "./pages/Add";
import AllAccount from "./pages/AllAccount";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import { Toaster } from "react-hot-toast";
import Analytics from "./pages/Analytics";



// eslint-disable-next-line react-refresh/only-export-components
export const backendUrl = import.meta.env.VITE_BACKEND_URL;
function App() {
  const [token, setToken] = useState(localStorage.getItem(`token`)?localStorage.getItem('token'): "");

  useEffect(()=>{
    localStorage.setItem('token', token)
  },[token])

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />

          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/allRequests" element={<AllRequests token={token} />}></Route>
                <Route path="/addEmail" element={<Add token={token} />}></Route>
                <Route path="/allUsers" element={<AllAccount  token={token}/>}></Route>
                <Route path="/analytics" element={<Analytics/>}></Route>
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
