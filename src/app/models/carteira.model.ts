export interface AcaoCarteira {
  ticker: string;
  empresa: string;
  dataCompra: string;
  quantidade: number;
  precoCompra: number;
}

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

export interface LinhaCarteira extends AcaoCarteira {
  cotacaoDia: number;
  totalAquisicao: number;
  valorAtual: number;
  variacaoPercentual: number;
}

export interface TotaisCarteira {
  totalAquisicao: number;
  valorAtual: number;
  variacaoPercentual: number;
}
