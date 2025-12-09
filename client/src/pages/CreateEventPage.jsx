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
  Loader2,
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

// Styles
import "../styles/CreateEventPage.css";
import LogoImg from "../assets/logo-memora.png";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const CreateEventPage = () => {
  const navigate = useNavigate();

  // --- STATES ---
  const [cpfError, setCpfError] = useState(false);
  const [telError, setTelError] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preço e Cupom (Dinâmico)
  const [precoOriginal] = useState(99.9);
  const [precoPromo, setPrecoPromo] = useState(99.9);

  // Estados do Cupom
  const [cupomAtivo, setCupomAtivo] = useState(0);
  const [descontoCupom, setDescontoCupom] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);

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

  // --- HANDLERS ---
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

  // --- VALIDAÇÃO DE CUPOM REAL (SUPABASE) ---
  const handleCupomBlur = async (e) => {
    const codigo = e.target.value.trim().toUpperCase();
    if (codigo.length > 0) {
      await validarCupom(codigo);
    } else {
      resetCupom();
    }
  };

  const resetCupom = () => {
    setPrecoPromo(precoOriginal);
    setCupomAtivo(0);
    setDescontoCupom(0);
    setTipoDesconto("");
  };

  const validarCupom = async (codigo) => {
    setValidandoCupom(true);
    setCupomAtivo(0);

    console.log("🔍 Validando cupom:", codigo);

    try {
      const { data, error } = await supabase
        .from("cupons")
        .select("*")
        .eq("codigo", codigo)
        .eq("ativo", true)
        .maybeSingle();

      if (error) {
        console.error("⚠️ Erro Banco de Dados (Cupom):", error.message);
        setCupomAtivo(2);
        resetCupom();
        return;
      }

      if (!data) {
        console.log("❌ Cupom não encontrado.");
        setCupomAtivo(2);
        resetCupom();
        return;
      }

      if (data.limite_uso !== null && data.usados >= data.limite_uso) {
        alert("Este cupom atingiu o limite de usos.");
        setCupomAtivo(2);
        resetCupom();
        return;
      }

      // --- SUCESSO: CUPOM VÁLIDO ---
      console.log("✅ Cupom Válido!", data);

      setCupomAtivo(1);
      setDescontoCupom(data.valor_desconto);
      setTipoDesconto(data.tipo);

      // --- LÓGICA DE PREÇO (COM FINAL .90) ---
      let novoPreco = precoOriginal;

      if (data.tipo === "porcentagem") {
        const desconto = (precoOriginal * data.valor_desconto) / 100;
        let valorComDesconto = precoOriginal - desconto;

        // Se for grátis (100%), mantém 0. Se não, força final .90
        if (valorComDesconto <= 0.1) {
          novoPreco = 0;
        } else {
          // Pega a parte inteira e soma 0.90
          novoPreco = Math.floor(valorComDesconto) + 0.9;
        }
      } else if (data.tipo === "valor_fixo") {
        let valorComDesconto = precoOriginal - data.valor_desconto;

        if (valorComDesconto <= 0) {
          novoPreco = 0;
        } else {
          novoPreco = Math.floor(valorComDesconto) + 0.9;
        }
      } else if (data.tipo === "isencao") {
        novoPreco = 0;
      }

      if (novoPreco < 0) novoPreco = 0;

      setPrecoPromo(novoPreco);
    } catch (err) {
      console.error("🔥 Erro Crítico Cupom:", err);
      setCupomAtivo(2);
      resetCupom();
    } finally {
      setValidandoCupom(false);
    }
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      const [dia, mes, ano] = dateEvent.split("/");
      const dataFormatada = `${ano}-${mes}-${dia}`;
      const meuSlug = nanoid();

      const valorFinal = parseFloat(Number(precoPromo).toFixed(2));

      const isFree = valorFinal <= 0;
      const statusInicial = isFree ? "SISTEMA NO AR" : "PENDENTE";
      const idPagamentoInicial = isFree ? `FREE_${Date.now()}` : null;

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
          cupom_usado: cupomAtivo === 1 ? cupomUser.toUpperCase() : null,
          valor_pago: valorFinal,
          status: statusInicial,
          asaas_id: idPagamentoInicial,
        },
      ]);

      if (error) throw error;

      console.log("Festa Salva! ID:", meuSlug);

      if (isFree) {
        alert("Cupom 100% aplicado! Festa liberada.");
        navigate(`/painel/${meuSlug}`);
      } else {
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
        setModalOpen(true);
      }
    } catch (err) {
      console.error("Erro ao criar festa:", err.message);
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
                  <div style={{ position: "relative", width: "100%" }}>
                    <Inputs
                      value={cupomUser}
                      onChange={(e) => setCupomUser(e.target.value)}
                      onBlur={handleCupomBlur}
                      title={"Cupom"}
                      placeholder={"Possui cupom?"}
                      icon={
                        validandoCupom ? (
                          <Loader2 className="spin" size={18} />
                        ) : (
                          <Ticket size={18} />
                        )
                      }
                      type={"text"}
                      req={false}
                      cupomAtivo={cupomAtivo}
                      descontoCupom={descontoCupom}
                    />
                  </div>
                </div>

                <div className="card-register-plan">
                  <div className="area-top">
                    <div className="title-plan">
                      <h1 className="text-gradient">Plano Infinity</h1>
                    </div>
                    <div className="price-plan">
                      {cupomAtivo === 1 && (
                        <h1 className="text-gradient cupom-ativo">
                          R$ {precoOriginal.toFixed(2).replace(".", ",")}
                        </h1>
                      )}
                      <h1 className="text-gradient">
                        R$ {Number(precoPromo).toFixed(2).replace(".", ",")}
                      </h1>
                    </div>
                  </div>
                </div>

                {cupomAtivo === 1 && (
                  <p className="subtitle-promo">
                    Cupom aplicado:{" "}
                    {tipoDesconto === "porcentagem"
                      ? `${descontoCupom}% OFF`
                      : `R$ ${descontoCupom} OFF`}
                  </p>
                )}
                {cupomAtivo === 2 && (
                  <p className="subtitle-promo error">
                    Cupom inválido ou expirado.
                  </p>
                )}
              </div>
            </div>

            <div className="area-button">
              <div className="button-create">
                <button disabled={loading}>
                  <CreditCard />
                  {loading
                    ? "Processando..."
                    : parseFloat(precoPromo) <= 0
                    ? "Criar Festa Grátis"
                    : "Pagar e Criar Festa"}
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
