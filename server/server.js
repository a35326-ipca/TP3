const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const mysql = require('mysql2/promise');

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tp3_carteira',
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors());
app.use(express.json());

app.get('/api/carteira', async (_req, res) => {
  try {
    const [linhas] = await pool.query(`
      SELECT
        ticker,
        empresa,
        DATE_FORMAT(data_compra, '%Y-%m-%d') AS dataCompra,
        quantidade,
        CAST(preco_compra AS DECIMAL(10, 2)) AS precoCompra
      FROM carteira_acoes
      ORDER BY id
    `);

    res.json(
      linhas.map((linha) => ({
        ...linha,
        quantidade: Number(linha.quantidade),
        precoCompra: Number(linha.precoCompra),
      })),
    );
  } catch (erro) {
    console.error('Erro ao obter a carteira:', erro.sqlMessage || erro.message || erro.code);
    res.status(500).json({ mensagem: 'Não foi possível obter a carteira.' });
  }
});

app.listen(port, () => {
  console.log(`API da carteira disponível em http://localhost:${port}`);
});
