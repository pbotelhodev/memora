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

import { useNavigate } from "react-router-dom";

//Database
import { supabase } from "../services/supabaseClient";

//Servidor
const API_URL = " https://hypogeous-uninquisitive-ally.ngrok-free.dev";

//Criptografia
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

//validators
import { maskCPF, maskPhone, maskDate, maskCEP } from "../utils/mask";
import {
  validarCPF,
  validarTelefone,
  validarData,
  validarCEP,
} from "../utils/validators";

//import componets
import Footer from "../components/Footer";
import Inputs from "../components/Inputs";
import PaymentModal from "../components/PaymentModal";
import Loading from "../components/Loading";

//Imports styles
import "../styles/CreateEventPage.css";

//Imports Images
import LogoImg from "../assets/logo-memora.png";

/* Banco de dados provisório */
const CUPONS_VALIDOS = {
  TESTE10: 10,
  TESTE15: 15,
  TESTE20: 20,
  TESTE50: 50,
  TESTE100: 100,
};

const CreateEventPage = () => {
  const navigate = useNavigate();
  /* ========== States ========== */

  //validators
  const [cpfError, setCpfError] = useState(false);
  const [telError, setTelError] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [loading, setLoading] = useState(false);

  //Cupom
  const [precoOriginal] = useState((99.9).toFixed(2));
  const [precoPromo, setPrecoPromo] = useState(precoOriginal);
  const [cupomAtivo, setCupomAtivo] = useState(0);
  const [descontoCupom, setDescontoCupom] = useState(0);

  //Users Info
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

  //Payment
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  /* =========== Masks ============ */
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

  //Validators Function
  const handleCpfBlur = () => {
    if (cpfUser.length > 0 && !validarCPF(cpfUser)) {
      setCpfError(true);
    }
  };
  const handleTelBlur = () => {
    if (whatsapp.length > 0 && !validarTelefone(whatsapp)) {
      setTelError(true);
    }
  };
  const handleDateBlur = () => {
    if (dateEvent.length > 0 && !validarData(dateEvent)) {
      setDataError(true);
    }
  };

  const handleCepBlur = () => {
    if (cepUser.length > 0 && !validarCEP(cepUser)) {
      setCepError(true);
    }
  };
  const handleCupomBlur = (e) => {
    let cupom = e.target.value.trim().toUpperCase();
    if (cupom.length > 0) {
      validarCupom(cupom);
    } else {
      setPrecoPromo(precoOriginal);
      setCupomAtivo(0);
    }
  };
  /* =========== Functions =========== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    // 1. Vaidação de segurança
    if (
      cpfError || // <--- ADICIONE ISSO (Impede salvar CPF inválido)
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
      alert("Ops! Preencha todos os campos obrigatórios para continuar.");
      return;
    }

    try {
      //2. Formata data para o DB
      const [dia, mes, ano] = dateEvent.split("/");
      const dataFormatada = `${ano}-${mes}-${dia}`;

      // 3. Gerar o slug(código) do evento
      const meuSlug = nanoid();

      // 4. salvar dados no supabase

      const { data, error } = await supabase
        .from("festas") // Nome da tabela que criamos
        .insert([
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
            cupom_usado: cupomUser || null, // Se tiver vazio manda null
            valor_pago: parseFloat(precoPromo),
            status: "PENDENTE",
          },
        ])
        .select(); // Pede pro banco confirmar o que salvou

      if (error) {
        throw error; //Se nao salvar no DB joga pro catch
      }
      console.log("FESTA SALVA COM SUCESSO!", data);
      console.log("Deu certo");

      // Aqui você redirecionaria para a tela de Pix ou Painel
      const dadosPagamento = {
        nome: nameUser,
        cpf: cpfUser,
        email: emailUser,
        valor: parseFloat(precoPromo),
      };

      const resposta = await fetch(`${API_URL}/criar-pagamento`, {
        method: "POST", // Estamos enviando dados
        headers: {
          "Content-Type": "application/json", // Avisa que é um JSON
        },
        body: JSON.stringify(dadosPagamento), // Transforma os dados em texto pra viajar na internet
      });

      // Transforma a resposta do servidor em objeto Javascript
      const jsonPix = await resposta.json();

      if (jsonPix.sucesso) {
        //Se for de graça
        if (jsonPix.isFree) {
          alert("Cupom de 100% aplicado! Sua festa foi liberada.");

          // 1. Atualiza o banco para ATIVO direto (sem esperar webhook)
          const { error: updateError } = await supabase
            .from("festas")
            .update({
              status: "SISTEMA NO AR", // Já libera
              asaas_id: jsonPix.pagamentoId,
            })
            .eq("slug", meuSlug);
          if (updateError) {
            console.error("ERRO AO LIBERAR FESTA GRÁTIS:", updateError);
            // Se der erro aqui, ele navega pro painel mas o banco continua PENDENTE
          }

          // 2. Manda pro Painel direto
          navigate(`/painel/${meuSlug}`);
          return; // Para por aqui
        }

        console.log("PIX GERADO!", jsonPix);

        //Se for pago =======================

        const { error: updateError } = await supabase
          .from("festas")
          .update({
            asaas_id: jsonPix.pagamentoId,
            link_pagamento: jsonPix.pixCopiaCola,
            link_nota_fiscal: jsonPix.qrCodeImagem,
          })
          .eq("slug", meuSlug); // Procura pela festa que acabamos de criar

        if (updateError) {
          console.error("Erro ao vincular pagamento:", updateError);
        } else {
          console.log("Pagamento vinculado com sucesso no banco!");
        }

        // Segue o fluxo normal
        setPaymentData({
          type: "PIX",
          pixCopiaCola: jsonPix.pixCopiaCola,
          qrCodeImagem: jsonPix.qrCodeImagem,
          slug: meuSlug,
        });

        setModalOpen(true);
      } else {
        console.error("Erro no Pix:", jsonPix.erro);
        alert("Erro ao gerar pagamento: " + jsonPix.erro);
      }
    } catch (err) {
      console.error("Erro ao salvar:", err.message);
      console.log("deu ruim");
    } finally {
      setLoading(false);
    }
  };

  const validarCupom = (cupom) => {
    const descCupom = CUPONS_VALIDOS[cupom];
    if (descCupom !== undefined) {
      setCupomAtivo(1);
      console.log(cupomAtivo);
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
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        paymentData={paymentData}
      />
      {loading && <Loading message="Criando sua festa..." />}
      {/* ========== Footer ========== */}
      <Footer />
    </div>
  );
};

export default CreateEventPage;
