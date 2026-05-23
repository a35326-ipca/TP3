import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, switchMap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AcaoCarteira, CotacaoFinnhub, LinhaCarteira } from '../models/carteira.model';

@Injectable({
  providedIn: 'root',
})
export class CarteiraService {
  private readonly ficheiroCarteira = 'assets/carteira.json';

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

  // Tenta usar a API local com MariaDB; se falhar usa o JSON.
  private carregarDadosCarteira(): Observable<AcaoCarteira[]> {
    return this.http
      .get<AcaoCarteira[]>(environment.carteiraApiUrl)
      .pipe(catchError(() => this.http.get<AcaoCarteira[]>(this.ficheiroCarteira)));
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
}
