require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// --- CONFIGURAÇÕES ---
app.use(cors());
app.use(express.json()); // OBRIGATÓRIO PARA LER O BODY DO ASAAS

// Configuração do Supabase (Para o Webhook usar)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// URL do Asaas (Produção ou Sandbox dependendo do .env)
const ASAAS_URL = process.env.ASAAS_URL;
const ASAAS_KEY = process.env.ASAAS_KEY;

app.get("/", (req, res) => {
  res.status(200).send("API Memora está ON! 🚀");
});
// --- ROTA 1: CRIAR PAGAMENTO (O que o seu site chama) ---
app.post("/criar-pagamento", async (req, res) => {
  try {
    const { nome, cpf, valor, tipo, cep, numero, phone } = req.body;

    // Cabeçalhos padrão do Asaas
    const headers = {
      "Content-Type": "application/json",
      access_token: ASAAS_KEY,
    };

    // 1. Criar ou Buscar Cliente no Asaas
    // (Simplificação: Cria um novo sempre ou busca pelo CPF se quiser melhorar depois)
    const clienteResponse = await axios.post(
      `${ASAAS_URL}/customers`,
      {
        name: nome,
        cpfCnpj: cpf,
        mobilePhone: phone || undefined,
        postalCode: cep || undefined,
        addressNumber: numero || undefined,
      },
      { headers }
    );

    const clienteId = clienteResponse.data.id;

    // 2. Criar a Cobrança
    const cobrancaBody = {
      customer: clienteId,
      billingType: tipo, // 'PIX' ou 'CREDIT_CARD'
      value: valor,
      dueDate: new Date().toISOString().split("T")[0], // Vence hoje
      description: "Plano Memora Infinity",
    };

    // Se for cartão, adiciona os dados
    if (tipo === "CREDIT_CARD" && req.body.card) {
      cobrancaBody.creditCard = req.body.card;
      cobrancaBody.creditCardHolderInfo = {
        name: req.body.card.holderName,
        email: req.body.email,
        cpfCnpj: cpf,
        postalCode: cep,
        addressNumber: numero,
        phone: phone, // Obrigatório para cartão
      };
    }

    const cobrancaResponse = await axios.post(
      `${ASAAS_URL}/payments`,
      cobrancaBody,
      { headers }
    );
    const pagamento = cobrancaResponse.data;

    // 3. Se for Pix, pega o QR Code
    let resultado = {
      sucesso: true,
      pagamentoId: pagamento.id,
      tipo: tipo,
      status: pagamento.status,
    };

    if (tipo === "PIX") {
      const qrResponse = await axios.get(
        `${ASAAS_URL}/payments/${pagamento.id}/pixQrCode`,
        { headers }
      );
      resultado.qrCodeImagem = qrResponse.data.encodedImage;
      resultado.pixCopiaCola = qrResponse.data.payload;
    }

    res.json(resultado);
  } catch (error) {
    console.error(
      "Erro ao criar pagamento:",
      error.response?.data || error.message
    );
    res.status(500).json({
      sucesso: false,
      erro:
        error.response?.data?.errors?.[0]?.description ||
        "Erro interno no servidor",
    });
  }
});

// --- ROTA 2: WEBHOOK (O que o Asaas chama) ---
// ESSA É A ROTA QUE ESTAVA FALTANDO OU DANDO 404
app.post("/webhook/asaas", async (req, res) => {
  try {
    const evento = req.body;

    // Log para você ver no Render que chegou
    console.log("🔔 Webhook recebeu evento:", evento.event);

    // Verifica se o pagamento foi recebido ou confirmado
    if (
      evento.event === "PAYMENT_RECEIVED" ||
      evento.event === "PAYMENT_CONFIRMED"
    ) {
      const idPagamentoAsaas = evento.payment.id; // Ex: pay_pel1bdf6u3zfsr7r

      console.log(
        `💰 Pagamento ${idPagamentoAsaas} Aprovado! Liberando festa...`
      );

      // Atualiza o status no Supabase
      const { data, error } = await supabase
        .from("festas")
        .update({ status: "SISTEMA NO AR" })
        .eq("asaas_id", idPagamentoAsaas);

      if (error) {
        console.error("❌ Erro ao atualizar Supabase:", error);
        // Não retorna erro 500 aqui para não travar o Asaas, mas loga o erro
      } else {
        console.log("✅ Festa liberada com sucesso no banco!");
      }
    }

    // SEMPRE responder 200 OK para o Asaas parar de mandar
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("🔥 Erro crítico no Webhook:", error);
    // Aqui retornamos 500 porque foi erro de código nosso
    res.status(500).send("Erro interno");
  }
});

// --- ROTA DE TESTE (Pra saber se o servidor tá vivo) ---
app.get("/", (req, res) => {
  res.send("API Memora rodando 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
