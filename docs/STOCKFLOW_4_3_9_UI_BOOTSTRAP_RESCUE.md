# StockFlow 4.3.9 — UI Bootstrap Rescue

## Problema corrigido

A aplicação carregava conteúdo, mas aparecia como uma tela branca com texto puro, indicando falha no carregamento/aplicação de CSS ou HTML shell corrompido/cacheado.

## Correções

- Garante `<head>` com `styles.css`.
- Adiciona `stockflow-ui-rescue.css` como camada visual de segurança.
- Reinsere scripts externos no final do body.
- Remove fallback inline bloqueado por CSP.
- Adiciona cache busting `?v=439`.
- Adiciona loader no `app.js` para garantir o CSS rescue se o navegador cachear errado.

## Como aplicar

Após aplicar o patch:

```bash
npm install
npm run check:ui
npm run dev
```

No navegador:

```txt
Ctrl + Shift + R
```

Se ainda abrir estranho, teste:

```txt
http://localhost:3333/styles.css?v=439
http://localhost:3333/stockflow-ui-rescue.css?v=439
```

Ambos precisam abrir CSS, não HTML.

## Observação

Não precisa rodar Prisma generate para este patch. Ele mexe apenas no frontend estático.
