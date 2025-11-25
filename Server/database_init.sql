-- Habilita a extensão para gerar UUIDs aleatórios (essencial para não usar ID 1, 2, 3)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Eventos (A Festa)
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL, -- ex: niver-pedro
    title VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Usuários (Os Convidados)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    avatar_url TEXT, -- Link da foto (pode ser nulo se ele ainda não tirou)
    role VARCHAR(20) DEFAULT 'GUEST', -- 'GUEST' ou 'ADMIN'
    event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- Se apagar evento, apaga users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Fotos (O Feed)
CREATE TABLE photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    url TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Se user sair, foto fica (mas sem dono)
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criando índices para o Feed não ficar lento quando tiver 1000 fotos
CREATE INDEX idx_photos_event ON photos(event_id);
CREATE INDEX idx_photos_created ON photos(created_at DESC);