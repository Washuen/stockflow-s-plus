# StockFlow 4.3.6 — Frontend Syntax & Auth Fix

## Problema corrigido

O navegador mostrava:

```txt
Uncaught SyntaxError: Unexpected identifier 'OWNER'
```

Esse erro quebrava o `app.js` antes de registrar o clique de login.

Além disso, o script inline do fallback era bloqueado por CSP:

```txt
Executing inline script violates Content Security Policy
```

## Correção

- Remove fallback inline do `index.html`.
- Corrige a expressão quebrada envolvendo `OWNER`.
- Mantém o fallback apenas dentro de `public/app.js`.
- Garante `window.stockFlowAuthFailsafe`.
- Garante clique em Entrar.
- Garante clique em Sair.
- Mantém Owner com permissão total no frontend.

## Teste

1. Aplicar o patch.
2. Reiniciar servidor.
3. Abrir o navegador.
4. Forçar cache reload:

```txt
Ctrl + Shift + R
```

5. Abrir Console e testar:

```js
stockFlowAuthFailsafe
stockFlowAuthFailsafe.login()
```

Agora não deve aparecer `undefined`.

## Diagnóstico

Como `npm run check:login` já retornou `Status: 200`, o backend está aprovado.
O problema era exclusivamente frontend/sintaxe/cache.
