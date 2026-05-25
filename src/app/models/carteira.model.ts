// Dados base guardados em JSON ou MariaDB.
export interface AcaoCarteira {
  ticker: string;
  empresa: string;
  dataCompra: string;
  quantidade: number;
  precoCompra: number;
}

// Resposta da API Finnhub para uma cotacao.
export interface CotacaoFinnhub {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

// Linha ja pronta para apresentar na tabela.
export interface LinhaCarteira extends AcaoCarteira {
  cotacaoDia: number;
  totalAquisicao: number;
  valorAtual: number;
  variacaoPercentual: number;
}

// Totais calculados para a carteira completa.
export interface TotaisCarteira {
  totalAquisicao: number;
  valorAtual: number;
  variacaoPercentual: number;
}

// Dados enviados quando o utilizador compra acoes.
export interface CompraAcao {
  ticker: string;
  empresa: string;
  dataCompra: string;
  quantidade: number;
  precoCompra: number;
}

// Dados enviados quando o utilizador vende acoes.
export interface VendaAcao {
  quantidade: number;
}
