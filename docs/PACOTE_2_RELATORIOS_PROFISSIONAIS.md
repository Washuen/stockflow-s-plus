# Pacote 2 — Relatórios Profissionais

## Objetivo

Transformar a área de relatórios do StockFlow em uma seção mais útil e profissional, com resumo executivo e exportações reais em CSV.

## Entregas

- Nova área de relatórios profissionais.
- Cards de indicadores no relatório.
- Resumo executivo automático.
- Botão para copiar resumo executivo.
- Exportação CSV do relatório geral.
- Exportação CSV de produtos críticos.
- Exportação CSV de top produtos.
- Exportação CSV de vendas.
- Exportação CSV de despesas.
- Data/hora de geração do relatório.
- Feedback visual após exportação.
- Tabelas extras para vendas e despesas na tela de relatórios.

## Arquivos alterados

- public/index.html
- public/styles.css
- public/app.js
- docs/PACOTE_2_RELATORIOS_PROFISSIONAIS.md

## Como testar

1. Rode o projeto:

```bash
npm run dev
```

2. Abra:

```txt
http://localhost:3333
```

3. Faça login:

```txt
admin@stockflow.dev
123456
```

4. Vá em Relatórios e teste:

- Gerar relatório;
- Exportar geral CSV;
- Exportar produtos críticos CSV;
- Exportar top produtos CSV;
- Exportar vendas CSV;
- Exportar despesas CSV;
- Copiar resumo executivo.

## Observação

Este pacote não altera o banco de dados nem o backend. As exportações são geradas no frontend com os dados já retornados pela API real.
