import { Route, Routes } from "react-router";
import "./App.css";
import { Accounts } from "./components/Accounts";
import { Reports } from "./components/Reports";
import { ClientManagement } from "./components/ClientManagement";
import { ProductManagement } from "./components/ProductManagement";

function App() {

  return (
    <div className="h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<Accounts/>}/>
        <Route path="/reportes" element={<Reports/>}/>
        <Route path="/clientes" element={<ClientManagement/>}/>
        <Route path="/productos" element={<ProductManagement/>}/>
      </Routes>
    </div>
  );
}

export default App;
