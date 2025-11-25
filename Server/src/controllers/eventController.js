const eventRepository = require("../repositories/eventRepository");

class EventController {
  async create(req, res) {
    try {
      const { title, slug } = req.body;
      //Validação
      if (!title || !slug) {
        return res
          .status(400)
          .json({ error: "Título e Slug são obrigatórios!" });
      }
      // Chama o operário (Repository) para salvar
      const newEvent = await eventRepository.create({ title, slug });

      // Retorna 201 (Created) com os dados
      return res.status(201).json(newEvent);
    } catch (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Esse link de evento já existe. Escolha outro." });
      }
      console.error(error);
      return res.status(500).json({ error: "Erro interno ao criar evento" });
    }
  }
  // 2. Buscar Evento pelo Link (Slug)
  async getBySlug(req, res) {
    try {
      const { slug } = req.params; // Vem da URL (gopic.com/evento/:slug)

      const event = await eventRepository.findBySlug(slug);

      if (!event) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      return res.json(event);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar evento" });
    }
  }
}

module.exports = new EventController();
