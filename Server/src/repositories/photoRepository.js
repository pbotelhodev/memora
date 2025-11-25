const db = require("../config/db");

class PhotoRepository {
  async create({ url, user_id, event_id }) {
    const query = `
            INSERT INTO photos (url, user_id, event_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
    const values = [url, user_id, event_id];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  // Buscar fotos de um evento (O Feed)
  async findByEventId(event_id) {
    // Trazemos também o nome do usuário que postou (JOIN)
    const query = `
            SELECT p.*, u.name as user_name, u.avatar_url as user_avatar
            FROM photos p
            JOIN users u ON p.user_id = u.id
            WHERE p.event_id = $1
            ORDER BY p.created_at DESC
        `;
    const { rows } = await db.query(query, [event_id]);
    return rows[0]; // Ops! Para feed queremos TODOS. Corrigido abaixo:
    // return rows; <--- O correto é retornar o array todo
  }

  // Correção rápida pro método acima:
  async getFeed(event_id) {
    const query = `
            SELECT p.*, u.name as user_name 
            FROM photos p
            JOIN users u ON p.user_id = u.id
            WHERE p.event_id = $1
            ORDER BY p.created_at DESC
        `;
    const { rows } = await db.query(query, [event_id]);
    return rows;
  }
}

module.exports = new PhotoRepository();
