//import { useState } from 'react'
import "./styles/global.css";
import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./routes";
import DashboardPage from "./pages/DashboardPage";
import GuestPage from "./pages/GuestPage";
import PainelAdmin from "./pages/PainelAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import AffiliatePage from "./pages/AffiliatePage";
import DemoPage from "./pages/DemoPage";

function App() {
  //const [count, setCount] = useState(0)

  return (
    <Routes>
      {/* Rota 1: Pagina inicial */}
      <Route path={ROUTES.HOME} element={<HomePage />} />
      {/* Rota 2: Criar Festa */}
      <Route path={ROUTES.CREATE_PARTY} element={<CreateEventPage />} />
      {/* Rota 3: Dashboard do evento*/}
      <Route path={ROUTES.SUCESS} element={<DashboardPage />} />
      {/* Rota 4: Feed do evento*/}
      <Route path={ROUTES.FEED} element={<GuestPage />} />
      {/* Rota 5: Login do administrador */}
      <Route path="/admin" element={<PainelAdmin />} />
      {/*  Rota 6: Painel Administrador*/}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/*  Rota 7: Afiliados */}
      <Route path="/afiliado" element={<AffiliatePage />} />
      {/*  Rota 8: Demonstração */}
      <Route path="/apresentacao" element={<DemoPage />} />
    </Routes>
  );
}

export default App;
