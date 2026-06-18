# Correção dos testes automatizados

## Problema encontrado

O Vitest atual não aceita mais ser importado com CommonJS desta forma:

```js
const { describe, it, expect } = require('vitest');
```

Por isso os testes falhavam antes mesmo de executar.

## Correção aplicada

Os arquivos em `tests/` foram atualizados para usar ES Modules:

```js
import { describe, it, expect } from 'vitest';
```

Também foi ajustado o `tests/helpers.js` para usar `import`.

## Como aplicar no seu projeto atual

Substitua a pasta `tests/` do seu projeto pela pasta `tests/` desta versão corrigida.

Depois rode:

```bash
npm run test
```

Se aparecer erro de banco, rode antes:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
```
