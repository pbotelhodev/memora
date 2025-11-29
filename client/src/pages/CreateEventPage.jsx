//Imports Tools
import { useEffect, useState } from "react";
import { ROUTES } from "../routes";
import {
  PartyPopper,
  User,
  CreditCard,
  Pencil,
  CalendarDays,
  MapPin,
  Mail,
  IdCard,
  House,
  Mailbox,
  Smartphone,
  Ticket,
} from "lucide-react";
import { maskCPF, maskPhone, maskDate, maskCEP } from "../utils/mask";

//import componets
import Footer from "../components/Footer";
import Inputs from "../components/Inputs";

//Imports styles
import "../styles/CreateEventPage.css";

//Imports Images
import LogoImg from "../assets/logo-memora.png";

const CreateEventPage = () => {
  /* ========== States ========== */
  const [nameUser, setNameUser] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [cpfUser, setCpfUser] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cepUser, setCepUser] = useState("");
  const [numberHouseUser, setNumberHouseUser] = useState("");

  const [titleEvent, setTitleEvent] = useState("");
  const [dateEvent, setDateEvent] = useState("");
  const [localEvent, setLocalEvent] = useState("");
  const [cupomUser, setCupomUser] = useState("");
  /* =========== Masks ============ */
  const handleCpfChange = (e) => {
    setCpfUser(maskCPF(e.target.value));
  };

  const handlePhoneChange = (e) => {
    setWhatsapp(maskPhone(e.target.value));
  };

  const handleDateChange = (e) => {
    setDateEvent(maskDate(e.target.value));
  };

  const handleCepChange = (e) => {
    setCepUser(maskCEP(e.target.value));
  };

  /* =========== Functions =========== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !nameUser ||
      !emailUser ||
      !cpfUser ||
      !whatsapp ||
      !cepUser ||
      !numberHouseUser ||
      !!titleEvent ||
      !dateEvent ||
      !cupomUser
    ) {
      alert("Ops! Preencha todos os campos obrigatórios para continuar.");
      return;
    }
    console.log(`Dados prontos:}`, {
      nameUser,
      emailUser,
      cpfUser,
      whatsapp,
      cepUser,
      numberHouseUser,
      cupomUser,
      titleEvent,
      dateEvent,
      localEvent,
    });
  };

  useEffect(() => {
    document.title = "Memora | Criar Festa";
  }, []);
  return (
    <div className="body-createEvent">
      {/* ========== Header ========= */}
      <div className="logo-memora">
        <img src={LogoImg} alt="logo memora" />
      </div>
      {/* ========== Main ========== */}
      <div className="main">
        <div className="container">
          <div className="title-group">
            <div className="main-title ">
              <h1>Crie Sua Festa</h1>
            </div>
            <div className="main-subtitle">
              Preencha os dados abaixo e crie uma rede social exclusiva para seu
              evento
            </div>
          </div>
          {/* ----- Primeiro Card ----- */}
          <form className="form" onSubmit={handleSubmit}>
            <div className="card-cadastro">
              <div className="card-register">
                <div className="title-card">
                  <div className="title-icon">
                    <User className="icon-card-create" />
                  </div>
                  <div className="text-title">
                    <p>Seus Dados</p>
                  </div>
                </div>
                <div className="subtitle-card">
                  <p>Informações do organizador</p>
                </div>
                <Inputs
                  value={nameUser}
                  onChange={(e) => setNameUser(e.target.value)}
                  title={"Nome Completo"}
                  placeholder={"Seu nome"}
                  icon={<Pencil size={18} />}
                  type={"text"}
                  req={true}
                />
                <Inputs
                  value={emailUser}
                  onChange={(e) => setEmailUser(e.target.value)}
                  title={"Email"}
                  placeholder={"seu@email.com"}
                  icon={<Mail size={18} />}
                  type={"email"}
                  req={true}
                />
                <div className="input-duo">
                  <Inputs
                    value={cpfUser}
                    onChange={handleCpfChange}
                    title={"CPF"}
                    placeholder={"000.000.000-00"}
                    icon={<IdCard size={18} />}
                    type={"text"}
                    req={true}
                  />
                  <Inputs
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    title={"Whatsapp"}
                    placeholder={"(99) 9 9999-9999"}
                    icon={<Smartphone size={18} />}
                    type={"text"}
                    req={true}
                  />
                </div>
                <div className="input-duo">
                  <Inputs
                    value={cepUser}
                    onChange={handleCepChange}
                    title={"CEP"}
                    placeholder={"00000-000"}
                    icon={<Mailbox size={18} />}
                    type={"tel"}
                    req={true}
                  />
                  <Inputs
                    value={whatsapp}
                    onChange={setNumberHouseUser}
                    title={"Número"}
                    placeholder={""}
                    icon={<House size={18} />}
                    type={"number"}
                    req={true}
                  />
                </div>
              </div>

              {/* ----- Segundo Card ----- */}
              <div className="card-register">
                <div className="title-card">
                  <div className="title-icon">
                    <PartyPopper className="icon-card-create" />
                  </div>
                  <div className="text-title">
                    <p>Informações da Festa</p>
                  </div>
                </div>
                <div className="subtitle-card">
                  <p>Detalhes do seu evento</p>
                </div>

                <Inputs
                  value={titleEvent}
                  onChange={(e) => setTitleEvent(e.target.value)}
                  title={"Nome da Festa"}
                  placeholder={"Ex: Aníversário do João"}
                  icon={<Pencil size={18} />}
                  type={"text"}
                  req={true}
                />
                <Inputs
                  value={localEvent}
                  onChange={(e) => setLocalEvent(e.target.value)}
                  title={"Local"}
                  placeholder={"Ex: Salão de Festas XYZ"}
                  icon={<MapPin size={18} />}
                  type={"text"}
                  req={false}
                />
                <div className="input-duo">
                  <Inputs
                    value={dateEvent}
                    onChange={handleDateChange}
                    title={"Data do evento"}
                    placeholder={"DD/MM/AAAA"}
                    icon={<CalendarDays size={18} />}
                    type={"tel"}
                    req={true}
                  />

                  <Inputs
                    value={cupomUser}
                    onChange={(e) => setCupomUser(e.target.value)}
                    title={"Cupom"}
                    placeholder={"Possui cupom?"}
                    icon={<Ticket size={18} />}
                    type={"text"}
                    req={false}
                  />
                </div>
                <div className="card-register-plan">
                  <div className="area-top">
                    <div className="title-plan">
                      <h1 className="text-gradient">Plano Infinity</h1>
                    </div>
                    <div className="price-plan">
                      <h1 className="text-gradient">R$ 99,90</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="area-button">
              <div className="button-create">
                <button>
                  <CreditCard />
                  Pagar e Criar Festa
                </button>
              </div>
              <div className="security">
                <p>Pagamento seguro via cartão de crédito ou pix</p>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* ========== Footer ========== */}
      <Footer />
    </div>
  );
};

export default CreateEventPage;
