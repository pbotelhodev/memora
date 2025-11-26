//Imports Tools
import { ROUTES } from "../routes";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  HouseHeart,
  Camera,
  User,
  QrCode,
  Share2,
} from "lucide-react";

//Imports components
import CardHowUse from "../components/CardHowUse";

//Imports Images
import LogoImg from "../assets/logo-GoPic.png";
import imgHero from "../assets/heroimg.png";
import PostImage from "../assets/photo-post.jpg";
import HalfImage from "../assets/half-image.png";
import PhotoProfile from "../assets/photo-profile.jpg";

//Imports styles
import "../styles/Header.css";
import "../styles/MainHome.css";

function HomePage() {
  return (
    <div>
      {/* ========== Header ========= */}
      <div className="nav-bar">
        <nav className=" container-header">
          <div className="logo-area">
            <img
              className="img-logo"
              src={LogoImg}
              alt="logoGoPic"
              style={{ width: "90px", height: "auto" }}
            />
          </div>
          <div className="button-area">
            <Link to={ROUTES.CREATE_PARTY}>
              <button className="btn-header">Criar Festa</button>
            </Link>
          </div>
        </nav>
      </div>

      {/* ========== Hero ========= */}
      <section className="hero-section">
        <div className="container-main-home">
          <div className="hero-left">
            <div className="hero-title-area">
              <h1 className="gradient">
                Sua Festa,
                <br /> Sua Rede Social
              </h1>
            </div>
            <div className="hero-subtitle-area">
              <p>
                Crie uma rede social exclusiva para sua festa! Compartilhe os
                momentos especiais com seus convidados em um espaço privado e
                personalizado.
              </p>
            </div>
            <div className="hero-buttom">
              <Link to={ROUTES.CREATE_PARTY}>
                <button>
                  Criar Minha Festa Agora <ArrowRight />
                </button>
              </Link>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-img-area">
              <img src={imgHero} />
            </div>
          </div>
        </div>
      </section>
      {/* ========== Showcase ========= */}
      <main>
        <section className="showcase">
          <div className="container-showcase">
            <div className="showcase-title">
              <h1 className="gradient">Experiência Mobile Completa</h1>
            </div>
            <div className="showcase-subtitle">
              <p>
                Seus convidados acessam pelo celular e compartilham momentos em
                tempo real.
              </p>
            </div>
            <div className="mockups-cell">
              {/* ===== Mockap 01 ===== */}
              <div className="cell-area">
                <div className="cellphone">
                  <div className="cell-header">
                    <h2 className="gradient">XVI da Aurora</h2>
                  </div>
                  <div className="post">
                    <div className="photo-user">
                      <div className="photo-icon">
                        <div className="icon"></div>
                      </div>
                      <div className="user-name">
                        <h5>Heithor Dutra</h5>
                      </div>
                    </div>
                    <div className="photo-post">
                      <img className="img-post" src={PostImage} />
                    </div>
                    <div className="likes">
                      <button className="like-btn">
                        <Heart />
                      </button>
                      <p className="count-like">256 likes</p>
                    </div>
                  </div>
                  <div className="halfpost">
                    <div className="photo-user">
                      <div className="photo-icon">
                        <div className="icon"></div>
                      </div>
                      <div className="user-name">
                        <h5>Athenas Botelho</h5>
                      </div>
                    </div>
                    <div className="half-photo">
                      <img src={HalfImage} />
                    </div>
                  </div>
                  <div className="cell-navbar">
                    <div className="btn-feed">
                      <button className="btn-bar">
                        <HouseHeart size={18} color="#8b5cf6" />
                      </button>
                    </div>
                    <div className="btn-camera">
                      <button className="btn-bar">
                        <Camera size={18} color="#8b5cf6" />
                      </button>
                    </div>
                    <div className="btn-profile">
                      <button className="btn-bar">
                        <User size={18} color="#8b5cf6" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="subtitle-cellphone">
                  <h4>Feed de Fotos</h4>
                </div>
              </div>

              {/* ===== Mockup 02 ===== */}
              <div className="cell-area">
                <div className="cellphone">
                  <div className="area-camera">
                    <div className="botao-camera" />
                  </div>
                </div>
                <div className="subtitle-cellphone">
                  <h4>Capturar Momento</h4>
                </div>
              </div>

              {/* ===== Mockup 03 ===== */}
              <div className="cell-area">
                <div className="cellphone">
                  <div className="profile">
                    <div className="area-profile">
                      <img className="photo-profile" src={PhotoProfile} />
                      <h4>Alice Medeiros</h4>
                    </div>
                    <div className="area-profile-photos">
                      <div className="row">
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/2214002796/pt/foto/gathering-of-friends-toasting-with-champagne-at-elegant-celebration.jpg?s=1024x1024&w=is&k=20&c=aRrly_4use3uUyJM_YUY_aZerBgguTnjw7H-v6xQ4fU="
                        />
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/489482504/pt/foto/alegria-de-vida.jpg?s=1024x1024&w=is&k=20&c=KITvgPDKnyWQciHUdODy5ChuP0oF7QbjMUsX0xvhYdY="
                          alt=""
                        />
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/2154710523/pt/foto/merry-christmas-happy-birthday-salut-cheers-happy-new-year-party-celebratory-toast.jpg?s=612x612&w=0&k=20&c=HC5-aIgzAEiPIs44nETbHi6JsVzzwP8rQZ9MtlpvSCk="
                          alt=""
                        />
                      </div>
                      <div className="row">
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/870047836/pt/foto/portrait-of-man-in-golden-suit.jpg?s=1024x1024&w=is&k=20&c=CT77sA8eYGiZZLTidXQN6p2-UlPZmy-Tdhi6AWds7dI="
                          alt=""
                        />
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/2154551932/pt/foto/merry-christmas-happy-birthday-salut-cheers-happy-new-year-party-celebration-toast.jpg?s=612x612&w=0&k=20&c=TLxQaXgk6wsK9rmftQsXBCVkS1UfSlVdmuyuVIik_tk="
                        />
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/476211275/pt/foto/ela-%C3%A9-mais-que-ela-possa-manipular.jpg?s=612x612&w=0&k=20&c=0A-yLqUQMyHf3OZDzRwMh1b54XxlaEpJp9hUUDwY1ww="
                          alt=""
                        />
                      </div>
                      <div className="row">
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/503199450/pt/foto/partido-dos-namorados-para-dois.jpg?s=612x612&w=0&k=20&c=-POjt9uTZJqJs1Ew3ZoJu_p_mmSg1h9folV1zdFsuzY="
                        />
                        <img
                          className="img-profile"
                          src="https://media.istockphoto.com/id/1246473695/pt/foto/preparing-lamb-beef-and-vegetable-kebab-with-green-salad-outside.jpg?s=612x612&w=0&k=20&c=s9BBtR82TVXL0BFh0jzewWEFzcIuyltUDuCvJuD5PW0="
                          alt=""
                        />
                        <img className="img-profile" src="" alt="" />
                      </div>
                      <div className="row">
                        <img className="img-profile" src="" />
                        <img className="img-profile" src="" alt="" />
                        <img className="img-profile" src="" alt="" />
                      </div>
                    </div>
                  </div>
                  <div className="cell-navbar">
                    <div className="btn-feed">
                      <button className="btn-bar">
                        <HouseHeart size={18} color="#8b5cf6" />
                      </button>
                    </div>
                    <div className="btn-camera">
                      <button className="btn-bar">
                        <Camera size={18} color="#8b5cf6" />
                      </button>
                    </div>
                    <div className="btn-profile">
                      <button className="btn-bar">
                        <User size={18} color="#8b5cf6" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="subtitle-cellphone">
                  <h4>Seu Perfil</h4>
                </div>
              </div>
            </div>
            <div className="feature-badge ">
              <p className="gradient">
                ✨ A experiência social que seus convidados já dominam
              </p>
            </div>
          </div>
        </section>

        {/* ========== StepSection ========= */}

        <section className="steps-section">
          <h1 className="gradient title-card-steps">Como funciona</h1>
          <div className="steps-container">
            <CardHowUse
              icon={<Camera className="icon-badge" />}
              title={"1. Crie Sua Festa"}
              subtitle={
                "Preencha os dados da sua festa: nome, data, local e personalize como quiser."
              }
            />
            <CardHowUse
              icon={<QrCode className="icon-badge" />}
              title={"1. Crie Sua Festa"}
              subtitle={
                "Após o pagamento, receba um QR code exclusivo com o link da rede social da sua festa."
              }
            />
            <CardHowUse
              icon={<Share2 className="icon-badge" />}
              title={"1. Crie Sua Festa"}
              subtitle={
                "Distribua o QR code para seus convidados e deixe todos compartilharem os melhores momentos!"
              }
            />
          </div>
        </section>
        <section className="cto-section">
          <div className="cto-card">
            <h1 className="gradient">Pronto para criar memórias incríveis?</h1>
            <p>
              Comece agora e transforme sua festa em uma experiência digital
              única!
            </p>
            <Link to={ROUTES.CREATE_PARTY}>
              <button>
                Criar Minha Festa Agora <ArrowRight />
              </button>
            </Link>
          </div>
        </section>
      </main>
      {/* ========== footer ========= */}
      <footer>
        <p>© 2026 GoPic. Todos os direitos reservados</p>
      </footer>

      {/* ========== Main ========= */}
    </div>
  );
}

export default HomePage;

/* 



*/
