const express = require("express");
const router = express.Router();
const uploadConfig = require("../config/uploads");

//Controllers
const eventController = require("../controllers/eventController");
const userController = require("../controllers/userController");
const photoController = require("../controllers/photoController");


// Definição das Rotas
router.post("/events", eventController.create); // Criar festa
router.get("/events/:slug", eventController.getBySlug); // Acessar festa

//Rotas de Usuário (login)
router.post('/login', userController.login)

//Rota de upload
router.post("/photos", uploadConfig.single("photo"), photoController.upload);
//Rota do feed
router.get("/events/:eventId/feed", photoController.getFeed);

module.exports = router;
