-- Extensão aditiva SOMA 2.0: valores em centavos, nenhum dinheiro real.
CREATE TABLE IF NOT EXISTS soma_migracoes (
  chave VARCHAR(60) PRIMARY KEY,
  aplicada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS perfis (
  usuario_id INT PRIMARY KEY,
  tipo ENUM('pessoa','instituicao') NOT NULL DEFAULT 'pessoa',
  biografia VARCHAR(1200) NOT NULL DEFAULT '',
  nome_instituicao VARCHAR(150) NOT NULL DEFAULT '',
  adulto BOOLEAN DEFAULT NULL,
  publico BOOLEAN NOT NULL DEFAULT FALSE,
  local_publico BOOLEAN NOT NULL DEFAULT FALSE,
  apoios_publicos BOOLEAN NOT NULL DEFAULT FALSE,
  cor ENUM('royal','verde','terracota') NOT NULL DEFAULT 'royal',
  avatar_id VARCHAR(36),
  capa_id VARCHAR(36),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS campanhas_detalhes (
  campanha_id VARCHAR(36) PRIMARY KEY,
  uf CHAR(2) NOT NULL DEFAULT '',
  municipio VARCHAR(100) NOT NULL DEFAULT '',
  mapa_autorizado BOOLEAN NOT NULL DEFAULT FALSE,
  imagem_id VARCHAR(36),
  visualizacoes INT NOT NULL DEFAULT 0,
  submetida BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS arquivos (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id INT NOT NULL,
  campanha_id VARCHAR(36),
  nome VARCHAR(150) NOT NULL,
  mime VARCHAR(40) NOT NULL,
  finalidade ENUM('documento','campanha','avatar','capa') NOT NULL,
  publico BOOLEAN NOT NULL DEFAULT FALSE,
  tamanho INT NOT NULL,
  conteudo MEDIUMBLOB NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS urgencias (
  campanha_id VARCHAR(36) PRIMARY KEY,
  natureza ENUM('vida','moradia','alimentacao','educacao','outros') NOT NULL,
  consequencias VARCHAR(3000) NOT NULL,
  prazo_limite DATE NOT NULL,
  recursos_disponiveis INT NOT NULL DEFAULT 0,
  estado ENUM('pendente','revisada','recurso') NOT NULL DEFAULT 'pendente',
  classe ENUM('regular','moderada','critica') NOT NULL DEFAULT 'regular',
  recomendacao ENUM('regular','moderada','critica') NOT NULL DEFAULT 'regular',
  pontos INT NOT NULL DEFAULT 0,
  evidencia_verificada BOOLEAN NOT NULL DEFAULT FALSE,
  evidencia_valida_ate DATE,
  revisado_por INT,
  justificativa VARCHAR(3000) NOT NULL DEFAULT '',
  revisada_em TIMESTAMP NULL,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (revisado_por) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS urgencia_historico (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campanha_id VARCHAR(36) NOT NULL,
  usuario_id INT NOT NULL,
  acao VARCHAR(40) NOT NULL,
  dados JSON NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS auditoria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT,
  campanha_id VARCHAR(36),
  acao VARCHAR(60) NOT NULL,
  dados JSON NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS receitas_publicitarias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referencia VARCHAR(120) NOT NULL UNIQUE,
  bruto INT NOT NULL CHECK (bruto > 0),
  tributos INT NOT NULL DEFAULT 0 CHECK (tributos >= 0),
  custos INT NOT NULL DEFAULT 0 CHECK (custos >= 0),
  justificativa VARCHAR(1000) NOT NULL,
  estado ENUM('pendente','confirmada','distribuida') NOT NULL DEFAULT 'pendente',
  modo ENUM('simulado') NOT NULL DEFAULT 'simulado',
  usuario_id INT NOT NULL,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmada_em TIMESTAMP NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CHECK (bruto >= tributos + custos)
);
CREATE TABLE IF NOT EXISTS distribuicoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  receita_id INT NOT NULL,
  campanha_id VARCHAR(36) NOT NULL,
  necessidade_id VARCHAR(36) NOT NULL,
  valor INT NOT NULL CHECK (valor > 0),
  peso DECIMAL(14,6) NOT NULL,
  criterios JSON NOT NULL,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (receita_id, necessidade_id),
  FOREIGN KEY (receita_id) REFERENCES receitas_publicitarias(id),
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (necessidade_id) REFERENCES necessidades(id)
);
CREATE TABLE IF NOT EXISTS lancamentos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campanha_id VARCHAR(36) NOT NULL,
  necessidade_id VARCHAR(36),
  origem ENUM('saldo_legado','doacao','estorno','anuncio','repasse') NOT NULL,
  referencia VARCHAR(120) NOT NULL UNIQUE,
  valor INT NOT NULL,
  modo ENUM('simulado') NOT NULL DEFAULT 'simulado',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (necessidade_id) REFERENCES necessidades(id)
);
CREATE TABLE IF NOT EXISTS visualizacoes (
  campanha_id VARCHAR(36) NOT NULL,
  visitante CHAR(64) NOT NULL,
  dia DATE NOT NULL,
  PRIMARY KEY (campanha_id, visitante, dia),
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS identidades (
  usuario_id INT NOT NULL,
  provedor VARCHAR(20) NOT NULL,
  sujeito VARCHAR(255) NOT NULL,
  PRIMARY KEY (provedor, sujeito),
  UNIQUE (usuario_id, provedor),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS oauth_fluxos (
  resumo_estado CHAR(64) PRIMARY KEY,
  verificador VARCHAR(128) NOT NULL,
  nonce VARCHAR(100) NOT NULL,
  expira_em BIGINT NOT NULL,
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS oauth_entregas (
  resumo_codigo CHAR(64) PRIMARY KEY,
  usuario_id INT NOT NULL,
  expira_em BIGINT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
