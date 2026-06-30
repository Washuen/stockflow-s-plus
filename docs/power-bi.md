# StockFlow S Plus — Camada Power BI

## Visão Geral

O StockFlow S Plus possui uma camada analítica preparada para integração com Power BI por meio de um endpoint específico de dataset operacional.

Essa camada foi criada para transformar dados internos do sistema em uma estrutura mais organizada, pronta para análise, dashboards e apresentação executiva.

O objetivo não é afirmar que o projeto já possui uma integração corporativa completa com Power BI em produção, mas sim demonstrar que o backend foi preparado com uma arquitetura compatível com análise de dados e Business Intelligence.

---

## Objetivo da Camada Power BI

A camada Power BI tem como objetivo:

- Centralizar dados operacionais do sistema.
- Expor KPIs de negócio.
- Organizar tabelas analíticas.
- Preparar dados para dashboards.
- Separar dados operacionais de dados analíticos.
- Facilitar leitura por ferramentas externas de BI.
- Demonstrar maturidade técnica em dados, backend e produto.

---

## Endpoint Principal

O endpoint principal da camada Power BI é:

```txt
GET /api/analytics/powerbi