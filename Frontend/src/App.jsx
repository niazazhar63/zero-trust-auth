import { BrowserRouter } from "react-router-dom"
import RequestAccess from "./pages/RequestAccess"
function App() {

  return (
    <BrowserRouter>
      <div className="">
        <RequestAccess />
      </div>
    </BrowserRouter>
  )
}

export default App
