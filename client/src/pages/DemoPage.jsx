import React from "react";
import { Camera, MonitorPlay, QrCode, FileDown } from "lucide-react";
import "../styles/DemoPage.css";
import logoFull from "../assets/logo-full.png";

// IMAGENS
import printCelular1 from "../assets/mockup-feed.png";
import printCelular2 from "../assets/mockup-camera.png";
import printCelular3 from "../assets/mockup-perfil.png";
import printTelao from "../assets/exemplo-telao.png";

// O SEU ARQUIVO PDF (Certifique-se que ele está na pasta assets com esse nome)
import arquivoPdf from "../assets/memoraPdf.pdf";

const DemoPage = () => {
  return (
    <div className="demo-wrapper">
      {/* --- BOTÃO FLUTUANTE (Agora baixa o arquivo) --- */}
      <a
        href={arquivoPdf}
        download="Apresentacao-Memora.pdf"
        className="btn-save-pdf"
        title="Baixar Apresentação em PDF"
      >
        <FileDown size={20} /> Salvar PDF
      </a>

      <div className="demo-container">
        {/* 1. HERO */}
        <header className="demo-hero">
          <img src={logoFull} alt="Memora" className="demo-logo" />
          <h1 className="demo-title">
            Conecte seus convidados <br />
            <span className="gradient-text">em tempo real.</span>
          </h1>
          <p className="demo-subtitle">
            A experiência completa: do celular de cada convidado direto para o
            telão do seu evento.
          </p>
        </header>

        {/* 2. MOCKUPS CELULARES */}
        <section className="demo-phones-section">
          <div className="phones-grid">
            <div className="phone-mockup">
              <img src={printCelular1} alt="Passo 1" />
            </div>
            <div className="phone-mockup center">
              <img src={printCelular2} alt="Passo 2" />
            </div>
            <div className="phone-mockup">
              <img src={printCelular3} alt="Passo 3" />
            </div>
          </div>
        </section>

        {/* 3. O TELÃO */}
        <section className="demo-tv-section">
          <div className="tv-container">
            <h2>Todos os olhares no Telão</h2>
            <div className="tv-frame">
              <div className="tv-screen">
                <img src={printTelao} alt="Telão" />
              </div>
              <div className="tv-stand"></div>
            </div>
          </div>
        </section>

        {/* 4. OS 3 PASSOS */}
        <section className="demo-steps">
          <div className="steps-grid">
            <div className="step-card">
              <div className="icon-box">
                <QrCode size={32} />
              </div>
              <h3>1. Escaneou</h3>
              <p>QR Codes nas mesas levam direto para o feed exclusivo.</p>
            </div>
            <div className="step-card">
              <div className="icon-box">
                <Camera size={32} />
              </div>
              <h3>2. Postou</h3>
              <p>O convidado registra o momento sem baixar nenhum app.</p>
            </div>
            <div className="step-card">
              <div className="icon-box">
                <MonitorPlay size={32} />
              </div>
              <h3>3. Brilhou</h3>
              <p>A foto aparece gigante no telão para a festa inteira ver.</p>
            </div>
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="demo-simple-footer">
          <p>Desenvolvido para conectar momentos reais.</p>
          <img
            src={logoFull}
            alt="Memora"
            height={30}
            style={{ opacity: 0.5, marginTop: "10px" }}
          />
        </footer>
      </div>
    </div>
  );
};

export default DemoPage;
