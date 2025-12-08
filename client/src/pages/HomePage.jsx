// Imports Tools
import { ROUTES } from "../routes";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, QrCode, Share2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

// Imports components
import CardHowUse from "../components/CardHowUse.jsx";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";

// Imports Images
// ATENÇÃO: Imagens não usam { } na importação
import imgHero from "../assets/heroimg.png";
import feedImg from "../assets/mockup-feed.png";
import cameraImg from "../assets/mockup-camera.png";
import profileImg from "../assets/mockup-perfil.png";

// Imports styles
import "../styles/Header.css";
import "../styles/MainHome.css";

function HomePage() {
  return (
    <div>
      <Helmet>
        <title>Memora | Sua Festa Social</title>
        <meta
          name="description"
          content="Bem-vindo ao Memora - A rede social da sua festa"
        />
      </Helmet>

      <Header />

      {/* ========== Main ========= */}
      <main>
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
                <img src={imgHero} alt="Celulares mostrando o app Memora" />
              </div>
            </div>
          </div>
        </section>

        {/* ========== Showcase ========= */}
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
              {/* ===== Mockup 01: Feed ===== */}
              <div className="cell-area">
                <img src={feedImg} alt="Tela do Feed" />

                <div className="subtitle-cellphone">
                  <h4>Feed de Fotos</h4>
                </div>
              </div>

              {/* ===== Mockup 02: Câmera ===== */}
              <div className="cell-area">
                <img src={cameraImg} alt="Tela da Câmera" />

                <div className="subtitle-cellphone">
                  <h4>Capture os momentos</h4>
                </div>
              </div>

              {/* ===== Mockup 03: Perfil ===== */}
              <div className="cell-area">
                <img src={profileImg} alt="Tela de Perfil" />

                <div className="subtitle-cellphone">
                  <h4>Seu Perfil</h4>
                </div>
              </div>
            </div>

            <div className="feature-badge">
              <p className="gradient">
                ✨ A experiência social que seus convidados já dominam
              </p>
            </div>
          </div>
        </section>

        {/* ========== StepSection ========= */}
        <section className="steps-section">
          <h1 className="title-card-steps">Como funciona</h1>
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
              title={"2. Gere o Qr Code"}
              subtitle={
                "Após o pagamento, receba um QR code exclusivo com o link da rede social da sua festa."
              }
            />
            <CardHowUse
              icon={<Share2 className="icon-badge" />}
              title={"3. Compartilhe"}
              subtitle={
                "Imprima o QR Code, coloque nas mesas e veja seus convidados postando fotos em tempo real."
              }
            />
          </div>
        </section>

        {/* ========== Cta Section ========= */}
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-card">
              <h1 className="gradient">
                Pronto para criar memórias incríveis?
              </h1>
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
