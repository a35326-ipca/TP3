// Configuracao usada pela aplicacao em desenvolvimento.
export const environment = {
  // Nunca colocar uma chave real antes de fazer commit.
  finnhubApiKey: '',
  // URL base da API externa de cotacoes.
  finnhubBaseUrl: 'https://finnhub.io/api/v1',
  // URL da API local que le a carteira na MariaDB.
  carteiraApiUrl: 'http://localhost:3000/api/carteira',
};
