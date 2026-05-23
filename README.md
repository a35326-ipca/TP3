# Carteira de ações - TP3

Aplicação Angular + TypeScript para apresentar o resumo de uma carteira de ações.

## O que faz

- Guarda os dados base da carteira em MariaDB através de um backend simples.
- Usa `src/assets/carteira.json` como fallback se o backend não estiver disponível.
- Obtém a cotação atual pela API REST da Finnhub.
- Calcula total de aquisição, valor atual e variação percentual por ação.
- Calcula os totais da carteira.
- Mostra resumo, tabela, gráfico simples e cores na variação.

## Configurar a API Finnhub

1. Criar uma chave gratuita em https://finnhub.io/.
2. Abrir `src/environments/environment.ts`.
3. Colocar a chave em `finnhubApiKey`.

Exemplo:

```ts
export const environment = {
  finnhubApiKey: 'A_SUA_CHAVE_AQUI',
  finnhubBaseUrl: 'https://finnhub.io/api/v1',
  carteiraApiUrl: 'http://localhost:3000/api/carteira',
};
```

## Configurar MariaDB

1. Iniciar o MariaDB, por exemplo através do XAMPP.
2. Executar o script SQL:

```bash
mysql -u root < server/database.sql
```

Também pode ser executado no phpMyAdmin, copiando o conteúdo de `server/database.sql`.

O script cria:

- base de dados `tp3_carteira`;
- tabela `carteira_acoes`;
- dados iniciais de `MSFT` e `TSLA`.

## Configurar o backend

Copiar `server/.env.example` para `server/.env` se for necessário alterar as credenciais.

Configuração padrão:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tp3_carteira
```

## Executar

Terminal 1, backend:

```bash
npm.cmd run server
```

Terminal 2, Angular:

```bash
npm.cmd start
```

Depois abrir `http://localhost:4200`.

## Nota

A base de dados guarda apenas os dados base da carteira: ticker, empresa, data de compra, quantidade e preço de compra. A cotação, o valor atual, os totais e as variações continuam a ser calculados dinamicamente.

