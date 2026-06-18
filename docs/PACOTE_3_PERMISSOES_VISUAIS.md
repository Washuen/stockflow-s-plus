# Pacote 3 — Permissões Visuais

## Objetivo

Fazer a interface do StockFlow respeitar visualmente o cargo do usuário, deixando o sistema mais parecido com um SaaS empresarial real.

## Entregas

- Menu lateral adaptado por cargo.
- Módulos sem acesso são ocultados.
- Formulários sem permissão são bloqueados visualmente.
- Botões proibidos são desabilitados ou ocultados.
- Mensagens amigáveis para ações sem permissão.
- Resumo visual do perfil atual no dashboard.
- Tags indicando quais módulos o usuário pode acessar.
- Proteção visual antes de chamar a API.
- Ações destrutivas respeitam permissão visual.
- Exportações respeitam permissão de relatórios.

## Perfis contemplados

- ADMIN: acesso total.
- MANAGER: acesso operacional amplo, sem usuários.
- STOCK: produtos e estoque.
- SALES: produtos e vendas.
- FINANCE: vendas, financeiro e relatórios.

## Arquivos alterados

- public/index.html
- public/styles.css
- public/app.js
- docs/PACOTE_3_PERMISSOES_VISUAIS.md

## Como testar

1. Rode o projeto:

```bash
npm run dev
```

2. Faça login com usuários diferentes:

```txt
admin@stockflow.dev / 123456
gerente@stockflow.dev / 123456
estoque@stockflow.dev / 123456
vendas@stockflow.dev / 123456
financeiro@stockflow.dev / 123456
```

3. Confira:

- O menu lateral muda por cargo.
- Formulários sem permissão ficam bloqueados.
- Botões proibidos deixam de aparecer ou são desabilitados.
- O dashboard mostra o perfil e os módulos disponíveis.
- A API continua protegida no backend.

## Observação

Este pacote melhora a experiência visual, mas não substitui as permissões do backend. O backend continua sendo a camada principal de segurança.
