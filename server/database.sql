CREATE DATABASE IF NOT EXISTS tp3_carteira
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tp3_carteira;

CREATE TABLE IF NOT EXISTS carteira_acoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  empresa VARCHAR(100) NOT NULL,
  data_compra DATE NOT NULL,
  quantidade INT NOT NULL,
  preco_compra DECIMAL(10, 2) NOT NULL
);

TRUNCATE TABLE carteira_acoes;

INSERT INTO carteira_acoes
  (ticker, empresa, data_compra, quantidade, preco_compra)
VALUES
  ('MSFT', 'Microsoft', '2026-03-01', 20, 320.00),
  ('TSLA', 'TESLA', '2026-03-20', 50, 220.00);
