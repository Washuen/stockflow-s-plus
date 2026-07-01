const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public', 'app.js');

if (!fs.existsSync(filePath)) {
  throw new Error('Arquivo public/app.js não encontrado. Rode este script na raiz do projeto.');
}

let code = fs.readFileSync(filePath, 'utf8');

function replaceOrFail(search, replacement, label) {
  if (!code.includes(search)) {
    throw new Error(`Trecho não encontrado: ${label}`);
  }

  code = code.replace(search, replacement);
}

function replaceRegexOrFail(regex, replacement, label) {
  if (!regex.test(code)) {
    throw new Error(`Trecho não encontrado: ${label}`);
  }

  code = code.replace(regex, replacement);
}

const bootBlock = `
document.documentElement.classList.add('sf-session-booting');

(function installSessionBootStyle() {
  const styleId = 'stockflow-session-boot-style';

  const css = \`
    html.sf-session-booting #loginView,
    html.sf-session-booting #appView {
      visibility: hidden !important;
    }

    html.sf-session-booting body::before {
      content: 'Verificando sessão...';
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      background: #07111f;
      color: #e8f4ff;
      font: 700 16px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0.02em;
    }
  \`;

  function appendStyle() {
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (document.head) {
    appendStyle();
  } else {
    document.addEventListener('DOMContentLoaded', appendStyle, { once: true });
  }
})();
`;

if (!code.includes('sf-session-booting')) {
  replaceOrFail(
    'let confirmCallback = null;',
    `let confirmCallback = null;${bootBlock}`,
    'inserção do estado de inicialização'
  );
}

const helperSearch = `function canManageUsers(){ return ['OWNER','ADMIN'].includes(String(currentUser?.role || '').toUpperCase()); }`;

const helperReplacement = `function canManageUsers(){ return ['OWNER','ADMIN'].includes(String(currentUser?.role || '').toUpperCase()); }
function roleLabel(role){ return ({OWNER:'Owner / Criador',ADMIN:'Administrador',MANAGER:'Gerente',STOCK:'Estoque',SALES:'Vendas',FINANCE:'Financeiro'})[String(role||'').toUpperCase()] || role || '-'; }
function removeSessionBooting(){ document.documentElement.classList.remove('sf-session-booting'); }
function syncGlobalState(){ Object.assign(window,{token,currentUser,products,sales,expenses,stockMovements,users,auditLogs,categories,reportsPayload,summary}); }`;

if (!code.includes('function roleLabel(role)')) {
  replaceOrFail(
    helperSearch,
    helperReplacement,
    'helpers de sessão e cargos'
  );
}

replaceRegexOrFail(
  /function showAuthed\(\)\{[^\n]*\}\nfunction showLogin\(\)\{[^\n]*\}/,
  `function showAuthed(){ syncGlobalState(); document.body.classList.add('is-authenticated'); document.body.classList.remove('is-logged-out'); $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); setAuthButtonsVisible(true); $('#authBadge').textContent = currentUser ? \`\${currentUser.name} • \${roleLabel(currentUser.role)}\` : 'Autenticado'; removeSessionBooting(); }
function showLogin(){ syncGlobalState(); document.body.classList.add('is-logged-out'); document.body.classList.remove('is-authenticated'); $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); setAuthButtonsVisible(false); $('#authBadge').textContent='Não autenticado'; removeSessionBooting(); }`,
  'showAuthed/showLogin'
);

replaceRegexOrFail(
  /async function refreshAll\(\)\{[\s\S]*?\}\s*(?=function numbers\(\))/,
  `async function refreshAll(){
  if(!token){
    showLogin();
    await checkHealth();
    return;
  }

  try{
    const me=await api('/auth/me');
    currentUser=me.user||me;
    localStorage.setItem(USER_KEY,JSON.stringify(currentUser));
    showAuthed();

    const results=await Promise.allSettled([
      api('/dashboard/summary'),
      api('/products'),
      api('/sales'),
      api('/expenses'),
      api('/stock-movements'),
      api('/users'),
      api('/reports'),
      api('/audit'),
      api('/categories')
    ]);

    summary=results[0].status==='fulfilled'?results[0].value:{};
    products=results[1].status==='fulfilled'?arr(results[1].value):[];
    sales=results[2].status==='fulfilled'?arr(results[2].value):[];
    expenses=results[3].status==='fulfilled'?arr(results[3].value):[];
    stockMovements=results[4].status==='fulfilled'?arr(results[4].value):[];
    users=results[5].status==='fulfilled'?arr(results[5].value):[];
    reportsPayload=results[6].status==='fulfilled'?results[6].value:{};
    auditLogs=results[7].status==='fulfilled'?arr(results[7].value):[];
    categories=results[8].status==='fulfilled'?arr(results[8].value):[];

    syncGlobalState();
    renderAll();
    setLastUpdate();
  }catch(err){
    console.warn(err);

    if(err.status===401){
      logout();
    } else {
      if(currentUser) showAuthed();
      toast(\`Falha ao atualizar dados: \${err.message}\`,'error');
    }
  } finally {
    removeSessionBooting();
    await checkHealth();
  }
}
`,
  'refreshAll'
);

replaceOrFail(
  `function renderAll(){ renderDashboard(); renderProducts(); renderStock(); renderSales(); renderFinance(); renderAudit(); renderReports(); renderUsers(); }`,
  `function renderAll(){ syncGlobalState(); renderDashboard(); renderProducts(); renderStock(); renderSales(); renderFinance(); renderAudit(); renderReports(); renderUsers(); }`,
  'renderAll'
);

replaceOrFail(
  `$('#currentAccessTitle').textContent=\`Perfil: \${currentUser?.role==='OWNER'?'Owner / Criador':currentUser?.role||'-'}\`; $('#currentAccessText').textContent=currentUser?.role==='OWNER'?'Acesso total de criador do sistema.':'Permissões conforme cargo atual.';`,
  `$('#currentAccessTitle').textContent=\`Perfil: \${roleLabel(currentUser?.role)}\`; $('#currentAccessText').textContent=currentUser?.role==='OWNER'?'Acesso total de criador do sistema.':'Permissões conforme cargo atual.';`,
  'perfil do dashboard'
);

replaceRegexOrFail(
  /function renderUsers\(\)\{[\s\S]*?\}\s*(?=function switchView\()/,
  `function renderUsers(){
  $('#usersRows').innerHTML=users.map(u=>{
    const inactive=u.isActive===false||!!u.deletedAt;
    const me=currentUser?.id===u.id;
    const role=u.role||'-';

    const roleOptions=['ADMIN','MANAGER','STOCK','SALES','FINANCE']
      .map(r=>\`<option value="\${r}" \${role===r?'selected':''}>\${roleLabel(r)}</option>\`)
      .join('');

    const roleCell=(me||role==='OWNER')
      ? \`<span class="chip">\${roleLabel(role)}</span>\`
      : \`<select class="inline-select" data-action="change-user-role" data-id="\${u.id}">\${roleOptions}</select>\`;

    const actions=me
      ? '<span class="status ok">Conta atual</span>'
      : \`<button class="\${inactive?'ghost-btn':'danger-btn'}" data-action="\${inactive?'reactivate-user':'deactivate-user'}" data-id="\${u.id}" data-name="\${u.name||u.email}">\${inactive?'Reativar':'Desativar'}</button>\`;

    return \`<tr><td><strong>\${u.name||'-'}</strong>\${me?'<small>Você</small>':''}</td><td>\${u.email||'-'}</td><td>\${roleCell}</td><td>\${date(u.createdAt)}</td><td>\${actions}</td></tr>\`;
  }).join('')||'<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
}

`,
  'renderUsers'
);

replaceRegexOrFail(
  /document\.addEventListener\('DOMContentLoaded',async\(\)=>\{ bindEvents\(\); await checkHealth\(\); if\(token\)\{ await refreshAll\(\); showAuthed\(\); \} else \{ showLogin\(\); \} \}\);/,
  `document.addEventListener('DOMContentLoaded',async()=>{
  bindEvents();

  try{
    await checkHealth();

    if(token){
      await refreshAll();
    } else {
      showLogin();
    }
  }catch(error){
    console.warn('[StockFlow boot]', error);

    if(token && currentUser){
      showAuthed();
    } else {
      showLogin();
    }
  } finally {
    removeSessionBooting();
  }
});`,
  'DOMContentLoaded principal'
);

fs.writeFileSync(filePath, code, 'utf8');

console.log('public/app.js atualizado com sucesso.');
console.log('Agora rode: npm test');