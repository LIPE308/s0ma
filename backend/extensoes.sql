CREATE TABLE IF NOT EXISTS perfis (
 usuario_id INT PRIMARY KEY, biografia VARCHAR(500) NOT NULL DEFAULT '', foto MEDIUMTEXT, capa MEDIUMTEXT,
 mostrar_apoios BOOLEAN NOT NULL DEFAULT FALSE, tipo ENUM('pessoa','instituicao') NOT NULL DEFAULT 'pessoa',
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS revisoes_urgencia (
 id INT PRIMARY KEY AUTO_INCREMENT, campanha_id VARCHAR(36) NOT NULL, autor_id INT NOT NULL,
 relato VARCHAR(4000) NOT NULL, estado ENUM('pendente','revisada') NOT NULL DEFAULT 'pendente',
 criterios TEXT, categoria VARCHAR(20) NOT NULL DEFAULT 'Regular', pontos INT NOT NULL DEFAULT 0,
 justificativa VARCHAR(2000) NOT NULL DEFAULT '', revisor_id INT, criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 revisada_em TIMESTAMP NULL, valida_ate TIMESTAMP NULL,
 FOREIGN KEY (campanha_id) REFERENCES campanhas(id), FOREIGN KEY (autor_id) REFERENCES usuarios(id), FOREIGN KEY (revisor_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS receitas_solidarias (
 id INT PRIMARY KEY AUTO_INCREMENT, referencia VARCHAR(100) NOT NULL UNIQUE, valor INT NOT NULL,
 autor_id INT NOT NULL, resultado MEDIUMTEXT NOT NULL, criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS distribuicoes_solidarias (
 receita_id INT NOT NULL, campanha_id VARCHAR(36) NOT NULL, valor INT NOT NULL,
 PRIMARY KEY (receita_id,campanha_id), FOREIGN KEY (receita_id) REFERENCES receitas_solidarias(id), FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS localizacoes_publicas (
 campanha_id VARCHAR(36) PRIMARY KEY, uf CHAR(2) NOT NULL,
 FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS imagens_campanha (
 campanha_id VARCHAR(36) PRIMARY KEY, imagem MEDIUMTEXT NOT NULL,
 FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS identidades_google (
 sub VARCHAR(255) PRIMARY KEY, usuario_id INT NOT NULL UNIQUE,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS marcos_financeiros (
 campanha_id VARCHAR(36) NOT NULL, chave VARCHAR(80) NOT NULL,
 alcancado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (campanha_id,chave), FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
