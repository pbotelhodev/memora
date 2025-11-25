const db = require('../config/db')

class UserRepository {
    //criar um convidado novo
    //precisamos de 3 coisas: nome, link da foto(opcinal no comeco) e ID da festa
    async create({name, avatar_url, event_id}) {
        const query = `
            INSERT INTO users (name, avatar_url, event_id)
            VALUES($1, $2, $3)
            RETURNING *
        `
        const values = [name, avatar_url, event_id];

        const { rows } = await db.query(query, values);
        return rows[0];
    }

    //Buscar usuário pelo ID(Pra verificar se ja logou antes)
    async findByID(id) {
        const query = `SELECT * FROM users WHERE id = $1`
        const { rows } = await db.query(query, [id])
        return rows[0]
    }


}

module.exports = new UserRepository