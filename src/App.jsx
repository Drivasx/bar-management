import { Route, Routes } from "react-router";
import "./App.css";
import { Accounts } from "./components/Accounts";
import { Reports } from "./components/Reports";

function App() {

  return (
    <Routes>
    <Route path="/" element={<Accounts/>}/>
    <Route path="/reportes" element={<Reports/>}/>
    </Routes>
  );
}

export default App;
