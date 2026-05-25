import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AcaoCarteira, CompraAcao, CotacaoFinnhub, LinhaCarteira, VendaAcao } from '../models/carteira.model';

@Injectable({
  providedIn: 'root',
})
export class CarteiraService {
  private readonly ficheiroCarteira = 'assets/carteira.json';
  private readonly chaveCarteiraLocal = 'carteira-acoes-json-local';

  constructor(private readonly http: HttpClient) {}

  // Carrega a carteira e junta cada acao com a cotacao atual.
  carregarCarteira(): Observable<LinhaCarteira[]> {
    return this.carregarDadosCarteira().pipe(
      switchMap((acoes) => {
        if (!environment.finnhubApiKey) {
          throw new Error('Configure a chave da API Finnhub em src/environments/environment.ts.');
        }

        const pedidos = acoes.map((acao) =>
          this.obterCotacao(acao.ticker).pipe(map((cotacao) => this.criarLinha(acao, cotacao.c))),
        );

        return forkJoin(pedidos);
      }),
    );
  }

  // Regista uma compra na API local.
  comprarAcao(compra: CompraAcao): Observable<AcaoCarteira> {
    return this.http
      .post<AcaoCarteira>(environment.carteiraApiUrl, compra)
      .pipe(catchError(() => this.comprarAcaoLocal(compra)));
  }

  // Regista uma venda na API local.
  venderAcao(ticker: string, venda: VendaAcao): Observable<AcaoCarteira | { removida: true }> {
    return this.http
      .patch<AcaoCarteira | { removida: true }>(`${environment.carteiraApiUrl}/${ticker}/vender`, venda)
      .pipe(catchError(() => this.venderAcaoLocal(ticker, venda)));
  }

  // Tenta usar a API local com MariaDB; se falhar usa o JSON.
  private carregarDadosCarteira(): Observable<AcaoCarteira[]> {
    return this.http
      .get<AcaoCarteira[]>(environment.carteiraApiUrl)
      .pipe(catchError(() => this.carregarCarteiraLocal()));
  }

  // Pede a cotacao atual de uma acao na API Finnhub.
  private obterCotacao(ticker: string): Observable<CotacaoFinnhub> {
    const url = `${environment.finnhubBaseUrl}/quote?symbol=${ticker}&token=${environment.finnhubApiKey}`;
    return this.http.get<CotacaoFinnhub>(url);
  }

  // Cria uma linha da tabela com valores calculados.
  private criarLinha(acao: AcaoCarteira, cotacaoDia: number): LinhaCarteira {
    const totalAquisicao = acao.quantidade * acao.precoCompra;
    const valorAtual = acao.quantidade * cotacaoDia;
    const variacaoPercentual = ((cotacaoDia - acao.precoCompra) / acao.precoCompra) * 100;

    return {
      ...acao,
      cotacaoDia,
      totalAquisicao,
      valorAtual,
      variacaoPercentual,
    };
  }

  // Usa o JSON inicial e guarda uma copia local para permitir compras/vendas sem BD.
  private carregarCarteiraLocal(): Observable<AcaoCarteira[]> {
    const carteiraGuardada = localStorage.getItem(this.chaveCarteiraLocal);

    if (carteiraGuardada) {
      return of(JSON.parse(carteiraGuardada) as AcaoCarteira[]);
    }

    return this.http.get<AcaoCarteira[]>(this.ficheiroCarteira).pipe(
      map((acoes) => {
        this.guardarCarteiraLocal(acoes);
        return acoes;
      }),
    );
  }

  private comprarAcaoLocal(compra: CompraAcao): Observable<AcaoCarteira> {
    return this.carregarCarteiraLocal().pipe(
      map((acoes) => {
        const ticker = compra.ticker.trim().toUpperCase();
        const indice = acoes.findIndex((acao) => acao.ticker === ticker);

        if (indice >= 0) {
          const atual = acoes[indice];
          const novaQuantidade = atual.quantidade + compra.quantidade;
          const novoPrecoMedio =
            (atual.quantidade * atual.precoCompra + compra.quantidade * compra.precoCompra) / novaQuantidade;

          acoes[indice] = {
            ...atual,
            empresa: compra.empresa,
            dataCompra: compra.dataCompra,
            quantidade: novaQuantidade,
            precoCompra: novoPrecoMedio,
          };
        } else {
          acoes.push({ ...compra, ticker });
        }

        this.guardarCarteiraLocal(acoes);
        return acoes.find((acao) => acao.ticker === ticker) as AcaoCarteira;
      }),
    );
  }

  private venderAcaoLocal(ticker: string, venda: VendaAcao): Observable<AcaoCarteira | { removida: true }> {
    return this.carregarCarteiraLocal().pipe(
      map((acoes) => {
        const tickerNormalizado = ticker.trim().toUpperCase();
        const indice = acoes.findIndex((acao) => acao.ticker === tickerNormalizado);

        if (indice < 0 || venda.quantidade > acoes[indice].quantidade) {
          throw new Error('Quantidade invalida.');
        }

        if (venda.quantidade === acoes[indice].quantidade) {
          acoes.splice(indice, 1);
          this.guardarCarteiraLocal(acoes);
          return { removida: true };
        }

        acoes[indice] = {
          ...acoes[indice],
          quantidade: acoes[indice].quantidade - venda.quantidade,
        };

        this.guardarCarteiraLocal(acoes);
        return acoes[indice];
      }),
    );
  }

  private guardarCarteiraLocal(acoes: AcaoCarteira[]): void {
    localStorage.setItem(this.chaveCarteiraLocal, JSON.stringify(acoes));
  }
}
