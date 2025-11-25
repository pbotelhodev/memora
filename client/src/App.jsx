//import { useState } from 'react'
import "./styles/global.css";
import HomePage from "./pages/HomePage";  
import CreateEventPage from './pages/CreateEventPage'
import SucessPage from './pages/SucessPage'
import { Routes, Route} from "react-router-dom";
import { ROUTES } from "./routes";


function App() {
  //const [count, setCount] = useState(0)

  return (
    <Routes>
      {/* Rota 1: Pagina inicial */}
      <Route path={ROUTES.HOME} element={<HomePage />} />
      {/* Rota 2: Criar Festa */}
      <Route path={ROUTES.CREATE_PARTY} element={<CreateEventPage />} />
      {/* Rota 1: Pagina inicial */}
      <Route path={ROUTES.SUCESS} element={<SucessPage />} />
      {/* Rota 1: Pagina inicial */}
      
    </Routes>
  );
}

export default App;
