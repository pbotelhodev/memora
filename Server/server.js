// server/server.js

const express = require("express");
const cors = require("cors");
const db = require("./src/config/db"); //Importo nossa conexão com o DB
const apiRoutes = require("./src/routes/api");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Usa as rotas que criamos com o prefixo /api
app.use("/api", apiRoutes);

//Rota de teste
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      messege: "Smarttex API Operacional 🚀",
      time_db: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Erro ao conectar no banco" });
  }
});

// Permite que o Front-end acesse arquivos da pasta /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//ligo nosso server

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
