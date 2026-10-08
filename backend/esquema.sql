-- MySQL 8.4. Valores monetários são centavos (inteiros), nunca FLOAT.
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_resumo VARCHAR(128) NOT NULL,
  senha_sal VARCHAR(32) NOT NULL,
  telefone VARCHAR(30) NOT NULL DEFAULT '',
  regiao VARCHAR(150) NOT NULL DEFAULT '',
  novidades BOOLEAN NOT NULL DEFAULT FALSE,
  administrador BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS sessoes (
  resumo_token VARCHAR(64) PRIMARY KEY,
  usuario_id INT NOT NULL,
  expira_em BIGINT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS campanhas (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  regiao VARCHAR(150) NOT NULL,
  prazo VARCHAR(30) NOT NULL,
  instrucoes VARCHAR(2000) NOT NULL DEFAULT '',
  evento VARCHAR(1000) NOT NULL DEFAULT '',
  estado ENUM('rascunho','ativa','encerrada','suspensa','ajustes') NOT NULL DEFAULT 'ativa',
  motivo VARCHAR(1000) NOT NULL DEFAULT '',
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS necessidades (
  id VARCHAR(36) PRIMARY KEY,
  campanha_id VARCHAR(36) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  tipo ENUM('objeto','tarefa','dinheiro') NOT NULL,
  meta INT NOT NULL CHECK (meta > 0),
  recebido INT NOT NULL DEFAULT 0 CHECK (recebido >= 0),
  tipo_meta ENUM('fechada','aberta') NOT NULL DEFAULT 'fechada',
  prioridade VARCHAR(20) NOT NULL DEFAULT 'Normal',
  prazo VARCHAR(30) NOT NULL DEFAULT '',
  descricao VARCHAR(2000) NOT NULL DEFAULT '',
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id)
);
CREATE TABLE IF NOT EXISTS ajudas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  campanha_id VARCHAR(36) NOT NULL,
  necessidade_id VARCHAR(36),
  tipo ENUM('objeto','tarefa','acao') NOT NULL,
  quantidade INT NOT NULL CHECK (quantidade > 0),
  recebido INT NOT NULL DEFAULT 0 CHECK (recebido >= 0),
  entrega VARCHAR(300) NOT NULL DEFAULT '',
  horario VARCHAR(100) NOT NULL DEFAULT '',
  observacao VARCHAR(2000) NOT NULL DEFAULT '',
  estado ENUM('reservado','em_andamento','realizado','cancelado') NOT NULL DEFAULT 'reservado',
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (necessidade_id) REFERENCES necessidades(id),
  CHECK (recebido <= quantidade)
);
CREATE TABLE IF NOT EXISTS atualizacoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campanha_id VARCHAR(36) NOT NULL,
  usuario_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  relato TEXT NOT NULL,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS pagamentos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  necessidade_id VARCHAR(36) NOT NULL,
  valor INT NOT NULL CHECK (valor >= 1000),
  taxa_soma INT NOT NULL,
  taxa_provedor INT NOT NULL,
  valor_liquido INT NOT NULL CHECK (valor_liquido > 0),
  meio ENUM('Pix','Crédito','Débito') NOT NULL,
  estado ENUM('pendente','confirmado','cancelado','reembolsado') NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (necessidade_id) REFERENCES necessidades(id)
);
CREATE TABLE IF NOT EXISTS repasses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campanha_id VARCHAR(36) NOT NULL,
  usuario_id INT NOT NULL,
  valor INT NOT NULL CHECK (valor > 0),
  finalidade VARCHAR(1000) NOT NULL,
  estado ENUM('solicitado','concluido','recusado','cancelado') NOT NULL DEFAULT 'solicitado',
  motivo VARCHAR(1000) NOT NULL DEFAULT '',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS denuncias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campanha_id VARCHAR(36) NOT NULL,
  usuario_id INT NOT NULL,
  motivo VARCHAR(150) NOT NULL,
  relato TEXT NOT NULL,
  estado ENUM('pendente','analisada') NOT NULL DEFAULT 'pendente',
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campanha_id) REFERENCES campanhas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE IF NOT EXISTS avisos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  mensagem VARCHAR(1000) NOT NULL,
  lido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
