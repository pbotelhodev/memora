import { ROUTES } from "../routes";
import { Link } from "react-router-dom";
import LogoImg from "../assets/logo-memora.png";

const Header = ({ showButton = true }) => {
  return (
    <div className="nav-bar">
      <nav className="container-header">
        <Link className="link-img" to={ROUTES.HOME}>
          <img className="img-logo" src={LogoImg} alt="logoGoPic" />
        </Link>

        {showButton === true ? (
          <Link to={ROUTES.CREATE_PARTY}>
            <button className="btn-header">Criar Festa</button>
          </Link>
        ) : null}
      </nav>
    </div>
  );
};

export default Header;
