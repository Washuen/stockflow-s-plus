# StockFlow 4.4.0 — Force Visual Runtime

## Problema corrigido

Os arquivos CSS estavam retornando 200, mas o navegador continuava exibindo a página como texto puro.

Isso indica que o HTML/DOM estava carregando conteúdo, mas a camada visual não era aplicada corretamente no runtime.

## Correção

Foi criado:

```txt
public/stockflow-force-ui.js
```

Esse arquivo:

- injeta uma camada visual em tempo de execução;
- força layout em grid;
- força sidebar, conteúdo, cards, tabelas e botões;
- adiciona cache busting `v=440`;
- garante que `styles.css` e `stockflow-ui-rescue.css` sejam carregados;
- não mexe no banco;
- não exige Prisma generate.

## Como aplicar

```bash
npm install
npm run check:ui
npm run dev
```

No navegador:

```txt
Ctrl + Shift + R
```

ou abra em janela anônima:

```txt
http://localhost:3333/?v=440
```

## Teste no Console

Se ainda parecer texto puro, abra o Console e rode:

```js
stockFlowForceUI.run()
```

Se a função existir, o patch foi carregado.
