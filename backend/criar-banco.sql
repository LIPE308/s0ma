-- Alternativa para quem já tem MySQL instalado. Execute como administrador.
-- Credenciais de exemplo para o projeto acadêmico local.
CREATE DATABASE IF NOT EXISTS soma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'soma'@'localhost' IDENTIFIED BY 'soma_local_123';
GRANT ALL PRIVILEGES ON soma.* TO 'soma'@'localhost';
