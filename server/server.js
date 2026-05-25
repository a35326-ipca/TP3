const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const mysql = require('mysql2/promise');

dotenv.config({ quiet: true });

// Configura o servidor da API local.
const app = express();
const port = Number(process.env.PORT || 3000);

// Cria a ligacao reutilizavel para a MariaDB.
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

function normalizarAcao(corpo) {
  return {
    ticker: String(corpo.ticker || '').trim().toUpperCase(),
    empresa: String(corpo.empresa || '').trim(),
    dataCompra: String(corpo.dataCompra || '').trim(),
    quantidade: Number(corpo.quantidade),
    precoCompra: Number(corpo.precoCompra),
  };
}

// Devolve os dados base da carteira guardados na base de dados.
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
      // Converte campos numericos para number antes de enviar ao Angular.
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

// Regista uma compra. Se o ticker existir, soma a quantidade e recalcula o preco medio.
app.post('/api/carteira', async (req, res) => {
  const acao = normalizarAcao(req.body);

  if (!acao.ticker || !acao.empresa || !acao.dataCompra || acao.quantidade <= 0 || acao.precoCompra <= 0) {
    return res.status(400).json({ mensagem: 'Dados da compra invalidos.' });
  }

  try {
    const [existentes] = await pool.query(
      `
        SELECT
          id,
          quantidade,
          CAST(preco_compra AS DECIMAL(10, 2)) AS precoCompra
        FROM carteira_acoes
        WHERE ticker = ?
        LIMIT 1
      `,
      [acao.ticker],
    );

    if (existentes.length > 0) {
      const existente = existentes[0];
      const quantidadeAtual = Number(existente.quantidade);
      const precoAtual = Number(existente.precoCompra);
      const novaQuantidade = quantidadeAtual + acao.quantidade;
      const novoPrecoMedio =
        (quantidadeAtual * precoAtual + acao.quantidade * acao.precoCompra) / novaQuantidade;

      await pool.query(
        `
          UPDATE carteira_acoes
          SET empresa = ?, data_compra = ?, quantidade = ?, preco_compra = ?
          WHERE id = ?
        `,
        [acao.empresa, acao.dataCompra, novaQuantidade, novoPrecoMedio, existente.id],
      );
    } else {
      await pool.query(
        `
          INSERT INTO carteira_acoes
            (ticker, empresa, data_compra, quantidade, preco_compra)
          VALUES
            (?, ?, ?, ?, ?)
        `,
        [acao.ticker, acao.empresa, acao.dataCompra, acao.quantidade, acao.precoCompra],
      );
    }

    res.status(201).json(acao);
  } catch (erro) {
    console.error('Erro ao registar compra:', erro.sqlMessage || erro.message || erro.code);
    res.status(500).json({ mensagem: 'Nao foi possivel registar a compra.' });
  }
});

// Regista uma venda. Se a quantidade chegar a zero, remove a acao da carteira.
app.patch('/api/carteira/:ticker/vender', async (req, res) => {
  const ticker = String(req.params.ticker || '').trim().toUpperCase();
  const quantidadeVendida = Number(req.body.quantidade);

  if (!ticker || quantidadeVendida <= 0) {
    return res.status(400).json({ mensagem: 'Dados da venda invalidos.' });
  }

  try {
    const [existentes] = await pool.query(
      `
        SELECT id, quantidade
        FROM carteira_acoes
        WHERE ticker = ?
        LIMIT 1
      `,
      [ticker],
    );

    if (existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Acao nao encontrada na carteira.' });
    }

    const existente = existentes[0];
    const quantidadeAtual = Number(existente.quantidade);

    if (quantidadeVendida > quantidadeAtual) {
      return res.status(400).json({ mensagem: 'Quantidade de venda superior a quantidade disponivel.' });
    }

    if (quantidadeVendida === quantidadeAtual) {
      await pool.query('DELETE FROM carteira_acoes WHERE id = ?', [existente.id]);
      return res.json({ removida: true });
    }

    await pool.query('UPDATE carteira_acoes SET quantidade = ? WHERE id = ?', [
      quantidadeAtual - quantidadeVendida,
      existente.id,
    ]);

    res.json({ ticker, quantidade: quantidadeAtual - quantidadeVendida });
  } catch (erro) {
    console.error('Erro ao registar venda:', erro.sqlMessage || erro.message || erro.code);
    res.status(500).json({ mensagem: 'Nao foi possivel registar a venda.' });
  }
});

app.listen(port, () => {
  console.log(`API da carteira disponível em http://localhost:${port}`);
});
