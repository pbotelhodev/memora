const userRepository = require("../repositories/userRepository");

class UserController {
  // O famoso "Login" (que na verdade é cadastro)
  async login(req, res) {
    try {
      // O front-end vai mandar: { name: "João", event_id: "aquele-uuid-gigante" }
      const { name, event_id } = req.body;

      if (!name || !event_id) {
        return res
          .status(400)
          .json({ error: "Nome e ID do evento são obrigatórios!" });
      }

      // Cria o usuário
      // Nota: avatar_url vai como null por enquanto, depois ele tira a foto
      const user = await userRepository.create({
        name,
        event_id,
        avatar_url: null,
      });

      // Devolve o usuário criado (com o ID dele) para o Front-end salvar no LocalStorage
      return res.status(201).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao registrar usuário" });
    }
  }
}

module.exports = new UserController();
