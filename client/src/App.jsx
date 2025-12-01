//import { useState } from 'react'
import "./styles/global.css";
import HomePage from "./pages/HomePage";  
import CreateEventPage from './pages/CreateEventPage'
import { Routes, Route} from "react-router-dom";
import { ROUTES } from "./routes";
import DashboardPage from "./pages/DashboardPage";


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
     
      
    </Routes>
  );
}

export default App;
