import { Link } from "react-router-dom";
import "../styles/Footer.css";
import { ROUTES } from "../routes";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="copyright">
          © 2025 Memora. Todos os direitos reservados.
        </p>

        <div className="footer-links">
          <Link to={ROUTES.SUCESS}>Termos de Uso</Link>
          <span className="separator"> | </span>
          <Link to={ROUTES.SUCESS}>Política de Privacidade</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
