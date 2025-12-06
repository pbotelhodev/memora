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
    // 1. Recebe e Blinda os dados
    const { nome, cpf, email, valor, tipo, card, cep, numero, phone } =
      req.body;
    //Log de conferência
    console.log("--> CHEGOU NO SERVER:", { nome, tipo, cep });

    // Garante que nada é undefined antes de usar .replace
    const cpfString = cpf || "";
    const cepString = cep || "39400000"; // Valor padrão se vier vazio
    const phoneString = phone || "99999999999"; // Valor padrão
    const numeroString = numero || "SN";

    // Limpa os dados com segurança
    const cpfLimpo = cpfString.replace(/\D/g, "");
    const cepLimpo = cepString.replace(/\D/g, "");
    const phoneLimpo = phoneString.replace(/\D/g, "");

    console.log("--> Pedido recebido:", { nome, valor, tipo, cep: cepLimpo });

    // --- 1. Se for GRÁTIS ---
    if (valor <= 0) {
      return res.json({
        sucesso: true,
        isFree: true,
        pagamentoId: "FREE_" + Date.now(),
      });
    }

    // --- 2. Criar Cliente no Asaas ---
    const clienteResponse = await asaasApi.post("/customers", {
      name: nome,
      cpfCnpj: cpfLimpo,
      email: email,
      notificationDisabled: false,
    });
    const clienteId = clienteResponse.data.id;

    // --- 3. Montar Objeto de Cobrança ---
    let cobrancaData = {
      customer: clienteId,
      billingType: tipo, // 'PIX' ou 'CREDIT_CARD'
      value: valor,
      dueDate: new Date().toISOString().split("T")[0],
      description: "Plano Memora Infinity",
    };

    // --- 4. SE FOR CARTÃO ---
    if (tipo === "CREDIT_CARD") {
      // Validação extra de segurança para o cartão
      if (!card || !card.holderName || !card.number) {
        return res
          .status(400)
          .json({ sucesso: false, erro: "Dados do cartão incompletos" });
      }

      cobrancaData = {
        ...cobrancaData,
        creditCard: {
          holderName: card.holderName,
          number: card.number,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear, // Já corrigimos o ano 2020 antes
          ccv: card.ccv,
        },
        creditCardHolderInfo: {
          name: nome,
          email: email,
          cpfCnpj: cpfLimpo,
          postalCode: cepLimpo,
          addressNumber: numeroString,
          phone: phoneLimpo,
        },
      };
    }

    // --- 5. ENVIAR ---
    const cobrancaResponse = await asaasApi.post("/payments", cobrancaData);
    const idCobranca = cobrancaResponse.data.id;
    const status = cobrancaResponse.data.status;

    // --- 6. RESPOSTA ---
    if (tipo === "PIX") {
      const qrCodeResponse = await asaasApi.get(
        `/payments/${idCobranca}/pixQrCode`
      );
      res.json({
        sucesso: true,
        tipo: "PIX",
        pagamentoId: idCobranca,
        pixCopiaCola: qrCodeResponse.data.payload,
        qrCodeImagem: qrCodeResponse.data.encodedImage,
      });
    } else {
      res.json({
        sucesso: true,
        tipo: "CREDIT_CARD",
        pagamentoId: idCobranca,
        status: status,
      });
    }
  } catch (error) {
    console.error("ERRO ASAAS:", error.response?.data || error.message);
    res.status(500).json({
      sucesso: false,
      erro:
        error.response?.data?.errors?.[0]?.description ||
        "Erro no processamento",
    });
  }
});

// Quando alguém acessar a rota raiz ('/'), responda isso:
app.get("/", (req, res) => {
  res.send("Backend do Memora está rodando! 🚀");
});
// Define a porta (usa a do .env ou a 5000)
const PORT = process.env.PORT || 5000;

console.log("--- DEBUG ASAAS ---");
console.log("URL usada:", process.env.ASAAS_URL); // ou a variável que você usa
console.log(
  "Chave começa com:",
  process.env.ASAAS_KEY ? process.env.ASAAS_KEY.substring(0, 15) : "SEM CHAVE"
);

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
