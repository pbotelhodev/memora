const photoRepository = require("../repositories/photoRepository");

class PhotoController {
  async upload(req, res) {
    try {
      // O Multer adiciona o objeto 'file' na requisição
      const file = req.file;
      const { user_id, event_id } = req.body;

      if (!file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      // Montamos a URL acessível (ex: http://localhost:3000/uploads/foto123.jpg)
      // Nota: Em produção isso muda, mas localmente é assim.
      const photoUrl = `${file.filename}`;

      const photo = await photoRepository.create({
        url: photoUrl,
        user_id,
        event_id,
      });

      return res.status(201).json(photo);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no upload" });
    }
  }
  
  async getFeed(req, res) {
    try {
      const { eventId } = req.params;

      const feed = await photoRepository.getFeed(eventId);

      // Retorna o array de fotos (mesmo que vazio)
      return res.json(feed);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao buscar o feed." });
    }
  }
}

module.exports = new PhotoController();
