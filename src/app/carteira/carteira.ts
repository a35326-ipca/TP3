import { Component, ElementRef, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';

import { LinhaCarteira, TotaisCarteira } from '../models/carteira.model';
import { CarteiraService } from '../services/carteira.service';

Chart.register(...registerables);

@Component({
  selector: 'app-carteira',
  templateUrl: './carteira.html',
  styleUrl: './carteira.css',
})
export class Carteira implements OnInit, OnDestroy {
  @ViewChild('graficoCarteira') set canvasGrafico(
    graficoCarteira: ElementRef<HTMLCanvasElement> | undefined,
  ) {
    this.graficoCarteira = graficoCarteira;
    this.agendarCriacaoGrafico();
  }

  @HostBinding('class.tema-escuro') get classeTemaEscuro(): boolean {
    return this.temaEscuro;
  }

  linhas: LinhaCarteira[] = [];
  totais: TotaisCarteira = {
    totalAquisicao: 0,
    valorAtual: 0,
    variacaoPercentual: 0,
  };
  numeroTotalAcoes = 0;
  temaEscuro = false;
  aCarregar = true;
  mensagemErro = '';
  private readonly chaveTema = 'tema-carteira-acoes';
  private graficoCarteira?: ElementRef<HTMLCanvasElement>;
  private grafico?: Chart;
  private graficoAgendado?: number;

  constructor(private readonly carteiraService: CarteiraService) {}

  ngOnInit(): void {
    this.temaEscuro = localStorage.getItem(this.chaveTema) === 'escuro';

    this.carteiraService.carregarCarteira().subscribe({
      next: (linhas) => {
        this.linhas = linhas;
        this.totais = this.calcularTotais(linhas);
        this.numeroTotalAcoes = this.calcularNumeroTotalAcoes(linhas);
        this.aCarregar = false;
        this.agendarCriacaoGrafico();
      },
      error: (erro) => {
        this.mensagemErro = erro?.message ?? 'Não foi possível carregar os dados da carteira.';
        this.aCarregar = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.graficoAgendado) {
      cancelAnimationFrame(this.graficoAgendado);
    }

    this.destruirGrafico();
  }

  alternarTema(): void {
    this.temaEscuro = !this.temaEscuro;
    localStorage.setItem(this.chaveTema, this.temaEscuro ? 'escuro' : 'claro');
    this.atualizarCoresGrafico();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  }

  formatarNumero(valor: number): string {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  }

  formatarPercentagem(valor: number): string {
    return `${this.formatarNumero(valor)}%`;
  }

  formatarData(data: string): string {
    return new Intl.DateTimeFormat('pt-PT').format(new Date(data));
  }

  classeVariacao(valor: number): string {
    if (valor > 0) {
      return 'variacao-positiva';
    }

    if (valor < 0) {
      return 'variacao-negativa';
    }

    return 'variacao-nula';
  }

  private calcularNumeroTotalAcoes(linhas: LinhaCarteira[]): number {
    return linhas.reduce((soma, linha) => soma + linha.quantidade, 0);
  }

  private calcularTotais(linhas: LinhaCarteira[]): TotaisCarteira {
    const totalAquisicao = linhas.reduce((soma, linha) => soma + linha.totalAquisicao, 0);
    const valorAtual = linhas.reduce((soma, linha) => soma + linha.valorAtual, 0);
    const variacaoPercentual =
      totalAquisicao === 0 ? 0 : ((valorAtual - totalAquisicao) / totalAquisicao) * 100;

    return {
      totalAquisicao,
      valorAtual,
      variacaoPercentual,
    };
  }

  private agendarCriacaoGrafico(): void {
    if (this.graficoAgendado) {
      cancelAnimationFrame(this.graficoAgendado);
    }

    this.graficoAgendado = requestAnimationFrame(() => {
      this.graficoAgendado = undefined;
      this.criarGrafico();
    });
  }

  private criarGrafico(): void {
    if (!this.graficoCarteira || this.linhas.length === 0) {
      return;
    }

    this.destruirGrafico();

    const cores = this.obterCoresGrafico();

    this.grafico = new Chart(this.graficoCarteira.nativeElement, {
      type: 'bar',
      data: {
        labels: this.linhas.map((linha) => linha.ticker),
        datasets: [
          {
            label: 'Valor investido',
            data: this.linhas.map((linha) => linha.totalAquisicao),
            backgroundColor: cores.valorInvestido,
            borderRadius: 6,
          },
          {
            label: 'Valor atual',
            data: this.linhas.map((linha) => linha.valorAtual),
            backgroundColor: cores.valorAtual,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: cores.texto,
              boxWidth: 12,
              boxHeight: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${this.formatarMoeda(Number(context.raw))}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: cores.texto,
            },
            grid: {
              color: cores.grelha,
            },
          },
          y: {
            ticks: {
              color: cores.texto,
              callback: (valor) => this.formatarMoeda(Number(valor)),
            },
            grid: {
              color: cores.grelha,
            },
          },
        },
      },
    });
  }

  private atualizarCoresGrafico(): void {
    if (!this.grafico) {
      this.agendarCriacaoGrafico();
      return;
    }

    const cores = this.obterCoresGrafico();
    this.grafico.data.datasets[0].backgroundColor = cores.valorInvestido;
    this.grafico.data.datasets[1].backgroundColor = cores.valorAtual;

    const legenda = this.grafico.options.plugins?.legend?.labels;
    if (legenda) {
      legenda.color = cores.texto;
    }

    const escalaX = this.grafico.options.scales?.['x'];
    const escalaY = this.grafico.options.scales?.['y'];

    if (escalaX?.ticks) {
      escalaX.ticks.color = cores.texto;
    }

    if (escalaX?.grid) {
      escalaX.grid.color = cores.grelha;
    }

    if (escalaY?.ticks) {
      escalaY.ticks.color = cores.texto;
    }

    if (escalaY?.grid) {
      escalaY.grid.color = cores.grelha;
    }

    this.grafico.update('none');
  }

  private destruirGrafico(): void {
    this.grafico?.destroy();
    this.grafico = undefined;
  }

  private obterCoresGrafico(): {
    valorInvestido: string;
    valorAtual: string;
    texto: string;
    grelha: string;
  } {
    if (this.temaEscuro) {
      return {
        valorInvestido: '#64748b',
        valorAtual: '#22c55e',
        texto: '#e5e7eb',
        grelha: '#334155',
      };
    }

    return {
      valorInvestido: '#475569',
      valorAtual: '#16a34a',
      texto: '#334155',
      grelha: '#e5e7eb',
    };
  }
}
