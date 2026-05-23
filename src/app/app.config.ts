import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';

// Configuracao global usada no arranque da app.
export const appConfig: ApplicationConfig = {
  providers: [
    // Ativa tratamento global de erros no browser.
    provideBrowserGlobalErrorListeners(),
    // Reduz trabalho repetido em eventos da interface.
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Permite usar HttpClient para JSON, backend e Finnhub.
    provideHttpClient(),
  ]
};
