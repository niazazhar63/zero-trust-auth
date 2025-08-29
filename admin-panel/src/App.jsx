import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Route,Routes } from 'react-router-dom'
import AllRequests from './pages/AllRequests'
import Add from "./pages/Add"
import AllAccount from './pages/AllAccount'
function App() {

  return (
    <div className='bg-gray-50 min-h-screen'>
      <Navbar />


      <div className='flex w-full'>
        <Sidebar />
        <div className='w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base'>

        <Routes>
          <Route path='/allRequests' element={<AllRequests />}></Route>
          <Route path='/addEmail' element={<Add />}></Route>
          <Route path='/allUsers' element={<AllAccount />}></Route>

        </Routes>
        </div>
      </div>

    </div>
    
  )
}

export default App
