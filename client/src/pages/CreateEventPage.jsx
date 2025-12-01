import { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { customAlphabet } from "nanoid";
import { maskCPF, maskPhone, maskDate, maskCEP } from "../utils/mask";
import {
  validarCPF,
  validarTelefone,
  validarData,
  validarCEP,
} from "../utils/validators";
import Footer from "../components/Footer";
import Inputs from "../components/Inputs";
import PaymentModal from "../components/PaymentModal";
import Loading from "../components/Loading";

//Styles
import "../styles/CreateEventPage.css";
import LogoImg from "../assets/logo-memora.png";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const CUPONS_VALIDOS = {
  TESTE10: 10,
  TESTE15: 15,
  TESTE20: 20,
  TESTE50: 50,
  TESTE100: 100,
};

const CreateEventPage = () => {
  const navigate = useNavigate();

  // --- STATES ---
  const [cpfError, setCpfError] = useState(false);
  const [telError, setTelError] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preço e Cupom
  const [precoOriginal] = useState((99.9).toFixed(2));
  const [precoPromo, setPrecoPromo] = useState(precoOriginal);
  const [cupomAtivo, setCupomAtivo] = useState(0);
  const [descontoCupom, setDescontoCupom] = useState(0);

  // Form Data
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

  // Modal Control
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // --- HANDLERS (Máscaras e Validações) ---
  const handleCpfChange = (e) => {
    setCpfUser(maskCPF(e.target.value));
    setCpfError(false);
  };
  const handlePhoneChange = (e) => {
    setWhatsapp(maskPhone(e.target.value));
    setTelError(false);
  };
  const handleDateChange = (e) => {
    setDateEvent(maskDate(e.target.value));
    setDataError(false);
  };
  const handleCepChange = (e) => {
    setCepUser(maskCEP(e.target.value));
    setCepError(false);
  };

  const handleCpfBlur = () => {
    if (cpfUser.length > 0 && !validarCPF(cpfUser)) setCpfError(true);
  };
  const handleTelBlur = () => {
    if (whatsapp.length > 0 && !validarTelefone(whatsapp)) setTelError(true);
  };
  const handleDateBlur = () => {
    if (dateEvent.length > 0 && !validarData(dateEvent)) setDataError(true);
  };
  const handleCepBlur = () => {
    if (cepUser.length > 0 && !validarCEP(cepUser)) setCepError(true);
  };

  const handleCupomBlur = (e) => {
    let cupom = e.target.value.trim().toUpperCase();
    if (cupom.length > 0) validarCupom(cupom);
    else {
      setPrecoPromo(precoOriginal);
      setCupomAtivo(0);
    }
  };

  const validarCupom = (cupom) => {
    const descCupom = CUPONS_VALIDOS[cupom];
    if (descCupom !== undefined) {
      setCupomAtivo(1);
      setDescontoCupom(descCupom);
      let valorDeDesconto = precoOriginal - precoOriginal * (descCupom / 100);
      let precoFinal =
        Math.floor(valorDeDesconto) + (descCupom === 100 ? 0 : 0.9);
      setPrecoPromo(precoFinal.toFixed(2));
    } else {
      setCupomAtivo(2);
      setDescontoCupom(0);
      setPrecoPromo(precoOriginal);
    }
  };

  // --- SUBMIT (Salvar e Abrir Modal) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. VALIDAÇÃO DE SEGURANÇA (O Porteiro)
    if (
      cpfError ||
      telError ||
      cepError ||
      dataError ||
      !nameUser ||
      !emailUser ||
      !cpfUser ||
      !whatsapp ||
      !cepUser ||
      !numberHouseUser ||
      !titleEvent ||
      !dateEvent
    ) {
      alert("Ops! Verifique os campos em vermelho ou obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      // 2. PREPARAÇÃO DOS DADOS
      // Formata data (DD/MM/AAAA -> YYYY-MM-DD)
      const [dia, mes, ano] = dateEvent.split("/");
      const dataFormatada = `${ano}-${mes}-${dia}`;

      // Gera ID único e limpa o valor
      const meuSlug = nanoid();
      const valorFinal = parseFloat(precoPromo);

      // Lógica "É Grátis?": Já define o status final aqui pra não precisar de update depois
      const isFree = valorFinal <= 0;
      const statusInicial = isFree ? "SISTEMA NO AR" : "PENDENTE";
      const idPagamentoInicial = isFree ? `FREE_${Date.now()}` : null;

      // 3. SALVAR NO SUPABASE (Apenas uma chamada)
      const { error } = await supabase.from("festas").insert([
        {
          slug: meuSlug,
          nome_cliente: nameUser,
          email_cliente: emailUser,
          cpf_cliente: cpfUser,
          whatsapp: whatsapp,
          cep: cepUser,
          numero_residencia: numberHouseUser,
          nome_festa: titleEvent,
          data_festa: dataFormatada,
          local_festa: localEvent || null,
          cupom_usado: cupomUser || null,
          valor_pago: valorFinal,
          status: statusInicial, // Já entra certo
          asaas_id: idPagamentoInicial, // Já entra certo se for free
        },
      ]);

      if (error) throw error;

      console.log("Festa Salva! ID:", meuSlug);

      // 4. DECISÃO DE FLUXO (Redirecionar ou Cobrar)
      if (isFree) {
        // --- CAMINHO VIP (GRÁTIS) ---
        alert("Cupom 100% aplicado! Festa liberada.");
        navigate(`/painel/${meuSlug}`);
      } else {
        // --- CAMINHO PAGAMENTO (MODAL) ---
        // Passamos TODOS os dados que o Modal e o Backend precisam (inclusive Endereço pro Cartão)
        setPaymentData({
          slug: meuSlug,
          valor: valorFinal,
          cliente: {
            nome: nameUser,
            cpf: cpfUser,
            email: emailUser,
            phone: whatsapp,
            cep: cepUser,
            numero: numberHouseUser,
          },
        });

        setModalOpen(true); // Abre o Modal
      }
    } catch (err) {
      console.error("Erro crítico:", err.message);
      alert("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Memora | Criar Festa";
  }, []);

  return (
    <div className="body-createEvent">
      <div className="logo-memora">
        <img src={LogoImg} alt="logo memora" />
      </div>

      <div className="main">
        <div className="container">
          <div className="title-group">
            <div className="main-title">
              <h1>Crie Sua Festa</h1>
            </div>
            <div className="main-subtitle">
              Preencha os dados abaixo e crie uma rede social exclusiva para seu
              evento
            </div>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="card-cadastro">
              {/* Card 1: Dados Pessoais */}
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
                    onBlur={handleCpfBlur}
                    title={"CPF"}
                    placeholder={"000.000.000-00"}
                    icon={<IdCard size={18} />}
                    type={"tel"}
                    req={true}
                    error={cpfError}
                  />
                  <Inputs
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    onBlur={handleTelBlur}
                    title={"Whatsapp"}
                    placeholder={"(99) 9 9999-9999"}
                    icon={<Smartphone size={18} />}
                    type={"tel"}
                    req={true}
                    error={telError}
                  />
                </div>
                <div className="input-duo">
                  <Inputs
                    value={cepUser}
                    onChange={handleCepChange}
                    onBlur={handleCepBlur}
                    title={"CEP"}
                    placeholder={"00000-000"}
                    icon={<Mailbox size={18} />}
                    type={"tel"}
                    req={true}
                    error={cepError}
                  />
                  <Inputs
                    value={numberHouseUser}
                    onChange={(e) => setNumberHouseUser(e.target.value)}
                    title={"Número"}
                    placeholder={"0000"}
                    icon={<House size={18} />}
                    type={"tel"}
                    req={true}
                  />
                </div>
              </div>

              {/* Card 2: Dados da Festa */}
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
                  maxLen={40}
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
                    onBlur={handleDateBlur}
                    title={"Data do evento"}
                    placeholder={"DD/MM/AAAA"}
                    icon={<CalendarDays size={18} />}
                    type={"tel"}
                    req={true}
                    error={dataError}
                  />
                  <Inputs
                    value={cupomUser}
                    onChange={(e) => setCupomUser(e.target.value)}
                    onBlur={handleCupomBlur}
                    title={"Cupom"}
                    placeholder={"Possui cupom?"}
                    icon={<Ticket size={18} />}
                    type={"text"}
                    req={false}
                    cupomAtivo={cupomAtivo}
                    descontoCupom={descontoCupom}
                  />
                </div>

                <div className="card-register-plan">
                  <div className="area-top">
                    <div className="title-plan">
                      <h1 className="text-gradient">Plano Infinity</h1>
                    </div>
                    <div className="price-plan">
                      {cupomAtivo === 1 && (
                        <h1 className="text-gradient cupom-ativo">R$99,90</h1>
                      )}
                      <h1 className="text-gradient">R$ {precoPromo}</h1>
                    </div>
                  </div>
                </div>
                {cupomAtivo === 1 && (
                  <p className="subtitle-promo">
                    Você recebeu um desconto de {descontoCupom}%
                  </p>
                )}
              </div>
            </div>

            <div className="area-button">
              <div className="button-create">
                <button>
                  <CreditCard /> Pagar e Criar Festa
                </button>
              </div>
              <div className="security">
                <p>Pagamento seguro via cartão de crédito ou pix</p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        paymentData={paymentData}
      />

      {loading && <Loading message="Processando..." />}
      <Footer />
    </div>
  );
};

export default CreateEventPage;
