//Importo o banco de dados
const db = require("../config/db");

class EventRepository {
  // 1. Criar um novo evento (A Festa)
  async create({ title, slug }) {
    const query = `
            INSERT INTO events (title, slug)
            VALUES ($1, $2)
            RETURNING *
        `;
    const values = [title, slug];

    const { rows } = await db.query(query, values);
    return rows[0];
  }
  // 2. Buscar evento pelo link (para saber se a festa existe)
  async findBySlug(slug) {
    const query = `SELECT * FROM events WHERE slg = $1 AND active = true`;
    const { rows } = await db.query(query, [slug]);
    return rows[0];
  }
  async findById(id) {
    const query = `SELECT * FROM events WHERE id = $1`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

module.exports = new EventRepository();
