CREATE TABLE IF NOT EXISTS administradores_locais (
  usuario_id INT PRIMARY KEY,
  provisionado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS email_entregas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  evento VARCHAR(120) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  campanha_id VARCHAR(36) NOT NULL,
  destinatario VARCHAR(150) NOT NULL,
  assunto VARCHAR(200) NOT NULL,
  texto TEXT NOT NULL,
  estado ENUM('pendente','enviando','enviado','falhou') NOT NULL DEFAULT 'pendente',
  tentativas INT NOT NULL DEFAULT 0,
  proxima_em BIGINT NOT NULL DEFAULT 0,
  bloqueada_em BIGINT NULL,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enviada_em TIMESTAMP NULL,
  erro_codigo VARCHAR(80) NOT NULL DEFAULT '',
  mensagem_id VARCHAR(200) NULL,
  INDEX email_fila (estado,proxima_em),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS relatorios_anuncios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provedor ENUM('adsense','admob') NOT NULL,
  conta VARCHAR(80) NOT NULL,
  inicio DATE NOT NULL,
  fim DATE NOT NULL,
  moeda CHAR(3) NOT NULL,
  estimado_centavos BIGINT NOT NULL,
  impressoes BIGINT NOT NULL DEFAULT 0,
  consultado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  UNIQUE (provedor,conta,inicio,fim,moeda),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
