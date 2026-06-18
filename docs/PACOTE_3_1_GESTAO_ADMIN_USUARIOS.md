# Pacote 3.1 — Gestão Admin de Usuários

## Objetivo

Fechar a gestão administrativa de usuários no StockFlow.

O perfil ADMIN agora consegue gerenciar os outros cargos de forma mais completa, com bloqueios de segurança para não excluir ou rebaixar a própria conta logada.

## Entregas

- Admin pode criar usuários de qualquer cargo, inclusive outro Admin.
- Admin pode alterar cargo de outros usuários.
- Admin pode excluir usuários de qualquer cargo.
- Admin não pode excluir a própria conta logada.
- Admin não pode alterar o próprio cargo logado.
- Tabela de usuários ganhou coluna de ações.
- Cada usuário pode ter cargo alterado diretamente na tabela.
- Usuários gerenciáveis têm botão Excluir.
- Usuário atual aparece com marcação "Você" / "Conta atual".
- Usuários não gerenciáveis exibem feedback visual.
- Backend recebeu proteção extra contra alteração do próprio cargo.
- Frontend recebeu mensagens mais claras para essas ações.

## Arquivos alterados

- public/index.html
- public/styles.css
- public/app.js
- src/services/user.service.js
- docs/PACOTE_3_1_GESTAO_ADMIN_USUARIOS.md

## Como testar

1. Faça login como Admin:

```txt
admin@stockflow.dev / 123456
```

2. Vá em Usuários.

3. Teste:
- Criar usuário ADMIN.
- Criar usuário MANAGER.
- Criar usuário STOCK.
- Criar usuário SALES.
- Criar usuário FINANCE.
- Alterar cargo de outro usuário.
- Excluir outro usuário.
- Conferir que a própria conta mostra "Conta atual".
- Conferir que a própria conta não tem botão de excluir.
- Conferir que a própria conta não pode ter o próprio cargo alterado por ela mesma.

4. Faça login com outro cargo e confirme que ele não consegue acessar gestão completa de usuários.

## Regra principal

Admin gerencia todos os outros usuários, mas não pode excluir nem rebaixar a própria conta logada.
