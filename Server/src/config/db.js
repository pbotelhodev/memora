//server/src/config/db.js

require("dotenv").config(); //Carrega as variaveis do .env
const { Pool } = require("pg");

//Configurando o pool

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT, 
});

//Teste de conexão ao iniciar(Para debug)
pool.on('connect', () => {
    console.log('Base de Dados conectada com sucesso')
})

pool.on("error", (err) => {
  console.log("Erro ao se conectar ao banco de dados", err);
  process.exit(-1)
});

//Exportamos 'query' para não precisar pegar conexão do pool manualmente toda vez

module.exports = {
    query: (text, params) => pool.query(text, params)
}
