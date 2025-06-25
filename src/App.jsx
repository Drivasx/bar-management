import { Route, Routes } from "react-router";
import "./App.css";
import { Accounts } from "./components/Accounts";
import { Reports } from "./components/Reports";

function App() {

  return (
    <div className="h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<Accounts/>}/>
        <Route path="/reportes" element={<Reports/>}/>
      </Routes>
    </div>
  );
}

export default App;
