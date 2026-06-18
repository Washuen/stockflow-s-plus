# StockFlow 4.4.1 — Clean Visual Rollback

## Objetivo

Corrigir a tela branca/texto puro que surgiu depois dos patches de resgate visual.

## O que esta versão faz

Remove completamente:

- `stockflow-force-ui.js`
- `stockflow-ui-rescue.css`
- loader visual forçado no `app.js`
- blocos CSS acidentais no `index.html`

Mantém:

- `styles.css` principal
- `app.js`
- `stockflow-auth-stabilizer.js`
- login Owner
- rotas do backend
- auditoria já conectada

## Como aplicar

Aplique o patch por cima da pasta atual.

Depois rode:

```bash
npm install
npm run check:visual-clean
npm run dev
```

No navegador, limpe bem o cache:

```txt
Ctrl + Shift + R
```

ou abra:

```txt
http://localhost:3333/?clean441=1
```

## Resultado esperado

O terminal NÃO deve mais mostrar chamadas para:

```txt
/stockflow-force-ui.js
/stockflow-ui-rescue.css
```

Deve mostrar apenas:

```txt
/styles.css?v=441
/app.js?v=441
/stockflow-auth-stabilizer.js?v=441
```

Se ainda aparecer `stockflow-ui-rescue` ou `stockflow-force-ui`, o navegador está usando cache ou o patch não foi aplicado na pasta atual.
