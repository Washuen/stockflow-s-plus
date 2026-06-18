# Pacote 3.6 — Fix do Clique em Desativar/Reativar Usuários

## Problema identificado

Pelo terminal, ao clicar em "Desativar", não aparecia nenhuma chamada:

```txt
PATCH /api/users/...
```

Isso indica que o clique do botão não estava disparando a função JavaScript.

## Correção aplicada

O frontend deixou de depender de `onclick` inline e passou a usar **event delegation**:

- botões usam `data-action`;
- botões usam `data-user-id`;
- a tabela `#usersTable` escuta os cliques;
- ao clicar, o sistema chama `deactivateUser` ou `reactivateUser`;
- o console do navegador mostra logs:
  - `[StockFlow User Action]`
  - `[StockFlow deactivate response]`
  - `[StockFlow deactivateUser error]`

## Como testar

1. Rode:

```bash
npm run dev
```

2. Abra:

```txt
http://localhost:3333
```

3. Faça login como Admin.

4. Vá em Usuários.

5. Clique em Desativar.

6. Verifique no terminal do backend se aparece:

```txt
PATCH /api/users/<id>/admin-status
```

Se aparecer, o clique está funcionando. Se der erro, o terminal e o toast vão mostrar o motivo real.

## Arquivos alterados

- public/app.js
- public/styles.css
