const express = require("express");

// 2. O CORS é o "Segurança". Ele deixa o seu site (localhost:5173) falar com esse servidor.
const cors = require("cors");

//const axios = require('axios');
const axios = require("axios");

//4. O Dotenv é o "Chaveiro".
require("dotenv").config();

/// Importe o cliente do Supabase no TOPO do arquivo, junto com os outros requires
const { createClient } = require("@supabase/supabase-js");

// Inicialize o Supabase com a chave SECRETA (Admin)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* Cria o app */
const app = express();

// CONFIGURAÇÕES OBRIGATÓRIAS:
// Diz pro servidor entender JSON (quando o React mandar dados)
app.use(express.json());
// Diz pro servidor aceitar conexões de fora (do seu Front-end)
app.use(cors());

// --- CONFIGURAÇÃO DO AXIOS (O Telefone do Asaas) ---
const asaasApi = axios.create({
  baseURL: process.env.ASAAS_URL, // Vai ler do seu arquivo .env
  headers: {
    access_token: process.env.ASAAS_KEY, // Vai ler a chave $aact...
  },
});

// --- ROTA DE PAGAMENTO PIX ---
app.post("/criar-pagamento", async (req, res) => {
  try {
    // 1. Recebe os dados que vieram do React
    const { nome, cpf, email, valor } = req.body;
    if (valor <= 0) {
      console.log("Evento Gratuito detectado via Cupom!");
      return res.json({
        sucesso: true,
        isFree: true, // Avisa o frontend que foi de graça
        pagamentoId: "FREE_" + Date.now(), // ID falso pra não quebrar
      });
    }
    console.log("--> Recebi pedido de Pix para:", nome, "| R$", valor);

    // 2. CRIAR CLIENTE NO ASAAS
    // O Asaas exige que a gente cadastre a pessoa antes de cobrar
    const respostaCliente = await asaasApi.post("/customers", {
      name: nome,
      cpfCnpj: cpf,
      email: email,
    });

    const idClienteAsaas = respostaCliente.data.id;
    console.log("1. Cliente criado no Asaas:", idClienteAsaas);

    // 3. GERAR O PIX
    const respostaCobranca = await asaasApi.post("/payments", {
      customer: idClienteAsaas,
      billingType: "PIX",
      value: valor,
      dueDate: new Date().toISOString().split("T")[0], // Vence hoje
      description: "Plano Memora - Infinty",
    });

    const idCobranca = respostaCobranca.data.id;
    console.log("2. Cobrança criada:", idCobranca);

    // 4. PEGAR O QR CODE (Imagem e Código)
    const respostaQrCode = await asaasApi.get(
      `/payments/${idCobranca}/pixQrCode`
    );

    console.log("3. QR Code obtido!");

    // 5. DEVOLVER TUDO PRO SEU SITE
    res.json({
      sucesso: true,
      pagamentoId: idCobranca,
      pixCopiaCola: respostaQrCode.data.payload,
      qrCodeImagem: respostaQrCode.data.encodedImage,
    });
  } catch (error) {
    console.error(
      "ERRO NO SERVIDOR:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao falar com o Asaas",
    });
  }
});

// Quando alguém acessar a rota raiz ('/'), responda isso:
app.get("/", (req, res) => {
  res.send("Backend do Memora está rodando! 🚀");
});
// Define a porta (usa a do .env ou a 5000)
const PORT = process.env.PORT || 5000;

// --- ROTA DE WEBHOOK (O Asaas chama isso aqui) ---
app.post("/webhook", async (req, res) => {
  try {
    const evento = req.body;

    // Log para você ver o que está chegando
    console.log(
      "🔔 Webhook recebeu:",
      evento.event,
      "| ID Pagamento:",
      evento.payment.id
    );

    // Se o evento for "PAGAMENTO RECEBIDO" ou "CONFIRMADO"
    if (
      evento.event === "PAYMENT_RECEIVED" ||
      evento.event === "PAYMENT_CONFIRMED"
    ) {
      const idPagamentoAsaas = evento.payment.id;

      // Atualiza o status no Banco de Dados
      const { data, error } = await supabaseAdmin
        .from("festas")
        .update({ status: "ATIVO" }) // Libera o acesso!
        .eq("asaas_id", idPagamentoAsaas); // Procura pela festa com esse pagamento

      if (error) {
        console.error("Erro ao atualizar banco:", error);
        return res.status(500).send("Erro interno");
      }

      console.log("✅ Festa liberada com sucesso!");
    }

    // Responde pro Asaas que entendeu (obrigatório)
    res.json({ received: true });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    res.status(500).json({ error: "Erro processando webhook" });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

/* ========================================================================== */
