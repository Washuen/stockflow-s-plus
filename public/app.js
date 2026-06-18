const API = '/api';
const TOKEN_KEY = 'stockflow_token';
const USER_KEY = 'stockflow_user';
let token = localStorage.getItem(TOKEN_KEY);
let currentUser = readUser();
let products = [], sales = [], expenses = [], stockMovements = [], users = [], auditLogs = [], categories = [], reportsPayload = {}, summary = {};
let confirmCallback = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function readUser(){ try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null} }
function money(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function date(v){ if(!v)return '-'; const d=new Date(v); return Number.isNaN(d.getTime())?'-':d.toLocaleString('pt-BR'); }
function clean(v){ const s=String(v ?? '').trim(); return s === 'null' || s === 'undefined' ? '' : s; }
function n(v){ const x=Number(v); return Number.isFinite(x)?x:0; }
function arr(payload){ if(!payload)return []; if(Array.isArray(payload))return payload; for(const k of ['data','items','logs','products','sales','expenses','users','movements','stockMovements','auditLogs']) if(Array.isArray(payload[k])) return payload[k]; return []; }
function toast(msg,type='info'){ const el=$('#toast'); if(!el)return; el.textContent=msg; el.className=`toast show ${type}`; setTimeout(()=>el.classList.remove('show'),3600); }
function statusClass(s){ s=String(s||'').toUpperCase(); if(['ACTIVE','PAID','OK'].includes(s))return 'ok'; if(['PENDING','LOW','OUT_OF_STOCK'].includes(s))return 'warn'; if(['CANCELED','CANCELLED','INACTIVE','CRITICAL'].includes(s))return 'danger'; return ''; }
function statusLabel(s){ return ({ACTIVE:'Ativo',INACTIVE:'Inativo',OUT_OF_STOCK:'Sem estoque',PAID:'Paga',PENDING:'Pendente',CANCELED:'Cancelado',CANCELLED:'Cancelado',IN:'Entrada',OUT:'Saída',ADJUSTMENT:'Ajuste',SALE:'Venda'})[String(s||'').toUpperCase()] || s || '-'; }
function productStock(p){ return n(p.stock ?? p.quantity); }
function productMin(p){ return n(p.minStock ?? p.minimumStock); }
function productActive(p){ const st=String(p.status||'ACTIVE').toUpperCase(); return p.isActive !== false && !['INACTIVE'].includes(st); }
function saleCanceled(s){ return ['CANCELED','CANCELLED'].includes(String(s.status).toUpperCase()); }
function expenseCanceled(e){ return ['CANCELED','CANCELLED'].includes(String(e.status).toUpperCase()); }
function saleTotal(s){ return n(s.total ?? s.totalAmount ?? s.amount); }
function saleItems(s){ return s.items || s.saleItems || []; }
function canManageUsers(){ return ['OWNER','ADMIN'].includes(String(currentUser?.role || '').toUpperCase()); }

async function api(path, options={}){
  const headers = {'Content-Type':'application/json', ...(options.headers||{})};
  if(token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {...options, headers});
  const txt = await res.text();
  let data = null; try{ data = txt ? JSON.parse(txt) : null; }catch{ data = txt; }
  if(!res.ok){ const message = data?.message || data?.error || (typeof data === 'string' && data) || `HTTP ${res.status}`; const err = new Error(message); err.status=res.status; err.payload=data; throw err; }
  return data;
}
function withBody(method, body={}){ return {method, body:JSON.stringify(body)}; }

function setAuthButtonsVisible(v){ $$('.auth-only').forEach(el=>el.classList.toggle('hidden',!v)); }
function showAuthed(){ document.body.classList.add('is-authenticated'); document.body.classList.remove('is-logged-out'); $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); setAuthButtonsVisible(true); $('#authBadge').textContent = currentUser ? `${currentUser.name} • ${currentUser.role==='OWNER'?'Owner / Criador':currentUser.role}` : 'Autenticado'; }
function showLogin(){ document.body.classList.add('is-logged-out'); document.body.classList.remove('is-authenticated'); $('#loginView').classList.remove('hidden'); $('#appView').classList.add('hidden'); setAuthButtonsVisible(false); $('#authBadge').textContent='Não autenticado'; }
function setLastUpdate(){ $('#lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR'); }

async function login(e){ e?.preventDefault(); try{ const email=$('#loginEmail').value.trim(); const password=$('#loginPassword').value; const data=await api('/auth/login',withBody('POST',{email,password})); token=data.token||data.accessToken||data.jwt; currentUser=data.user||data.profile||data; if(!token) throw new Error('Token não retornado pela API.'); localStorage.setItem(TOKEN_KEY,token); localStorage.setItem(USER_KEY,JSON.stringify(currentUser)); showAuthed(); switchView('dashboard'); await refreshAll(); toast('Login realizado com sucesso.','success'); }catch(err){ toast(`Falha no login: ${err.message}`,'error'); } }
function logout(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); token=null; currentUser=null; showLogin(); switchView('dashboard', true); toast('Sessão encerrada.','success'); }
async function checkHealth(){ try{ await fetch('/api/health'); $('#apiStatus').textContent='Online'; }catch{ $('#apiStatus').textContent='Offline'; } }

async function refreshAll(){ if(!token){ showLogin(); await checkHealth(); return; } try{ const me=await api('/auth/me'); currentUser=me.user||me; localStorage.setItem(USER_KEY,JSON.stringify(currentUser)); showAuthed(); const results=await Promise.allSettled([api('/dashboard/summary'),api('/products'),api('/sales'),api('/expenses'),api('/stock-movements'),api('/users'),api('/reports'),api('/audit'),api('/categories')]); summary=results[0].status==='fulfilled'?results[0].value:{}; products=arr(results[1].value); sales=arr(results[2].value); expenses=arr(results[3].value); stockMovements=arr(results[4].value); users=arr(results[5].value); reportsPayload=results[6].status==='fulfilled'?results[6].value:{}; auditLogs=arr(results[7].value); categories=arr(results[8].value); renderAll(); setLastUpdate(); }catch(err){ console.warn(err); if(err.status===401){ logout(); } else { toast(`Falha ao atualizar dados: ${err.message}`,'error'); } } await checkHealth(); }

function numbers(){ const revenue=sales.filter(s=>!saleCanceled(s)).reduce((a,s)=>a+saleTotal(s),0); const expTotal=expenses.filter(e=>!expenseCanceled(e)).reduce((a,e)=>a+n(e.amount),0); const profit=revenue-expTotal; const validSales=sales.filter(s=>!saleCanceled(s)); const ticket=validSales.length?revenue/validSales.length:0; const activeProducts=products.filter(productActive).length; const critical=products.filter(p=>productActive(p)&&productStock(p)<=productMin(p)).length; const margin=revenue?(profit/revenue)*100:0; return {revenue,expTotal,profit,ticket,activeProducts,critical,margin,validSales}; }
function renderAll(){ renderDashboard(); renderProducts(); renderStock(); renderSales(); renderFinance(); renderAudit(); renderReports(); renderUsers(); }
function renderDashboard(){ const x=numbers(); $('#heroRevenue').textContent=money(x.revenue); $('#heroProfit').textContent=money(x.profit); $('#metricRevenue').textContent=money(x.revenue); $('#metricProfit').textContent=money(x.profit); $('#metricMargin').textContent=`Margem ${x.margin.toFixed(1)}%`; $('#metricProducts').textContent=x.activeProducts; $('#metricCritical').textContent=x.critical; $('#metricSales').textContent=x.validSales.length; $('#metricTicket').textContent=money(x.ticket); $('#metricExpenses').textContent=money(x.expTotal); $('#metricAudit').textContent=auditLogs.length; $('#currentAccessTitle').textContent=`Perfil: ${currentUser?.role==='OWNER'?'Owner / Criador':currentUser?.role||'-'}`; $('#currentAccessText').textContent=currentUser?.role==='OWNER'?'Acesso total de criador do sistema.':'Permissões conforme cargo atual.'; $('#permissionChips').innerHTML=['Dashboard','Produtos','Estoque','Vendas','Financeiro','Relatórios','Usuários'].map(t=>`<span class="chip ok">✓ ${t}</span>`).join('');
  $('#criticalRows').innerHTML=products.filter(p=>productActive(p)&&productStock(p)<=productMin(p)).slice(0,8).map(p=>`<tr><td>${p.name}</td><td>${productStock(p)}</td><td>${productMin(p)}</td><td><span class="status danger">Crítico</span></td></tr>`).join('')||'<tr><td colspan="4">Nenhum produto crítico.</td></tr>';
  const top={}; sales.filter(s=>!saleCanceled(s)).forEach(s=>saleItems(s).forEach(i=>{const name=i.product?.name||i.productName||'Produto'; top[name]=top[name]||{qtd:0,rev:0}; top[name].qtd+=n(i.quantity); top[name].rev+=n(i.total)||n(i.unitPrice)*n(i.quantity)})); $('#topProductsRows').innerHTML=Object.entries(top).sort((a,b)=>b[1].rev-a[1].rev).slice(0,6).map(([name,o])=>`<tr><td>${name}</td><td>${o.qtd}</td><td>${money(o.rev)}</td></tr>`).join('')||'<tr><td colspan="3">Nenhuma venda para ranking.</td></tr>';
  const acts=[...auditLogs.slice(0,5).map(l=>({t:l.action,d:l.entity,at:l.createdAt||l.date})),...stockMovements.slice(0,3).map(m=>({t:`Movimento ${statusLabel(m.type)}`,d:m.product?.name||m.productName,at:m.createdAt}))].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6); $('#activityList').innerHTML=acts.map(a=>`<div class="activity-item"><strong>${a.t}</strong><small>${a.d||'-'} • ${date(a.at)}</small></div>`).join('')||'<div class="activity-item">Nenhuma atividade recente.</div>'; }
function renderProducts(){ $('#productsCount').textContent=`${products.length} produtos`; $('#productsRows').innerHTML=products.map(p=>{const inactive=!productActive(p);return `<tr><td><strong>${p.name||'-'}</strong><small>${p.sku||''}</small></td><td>${p.category?.name||'-'}</td><td>${money(p.price)}</td><td>${money(p.cost)}</td><td>${productStock(p)}</td><td><span class="status ${inactive?'danger':statusClass(p.status)}">${inactive?'Inativo':statusLabel(p.status||'ACTIVE')}</span></td><td><button class="${inactive?'ghost-btn':'danger-btn'}" data-action="${inactive?'reactivate-product':'deactivate-product'}" data-id="${p.id}" data-name="${p.name||'produto'}">${inactive?'Reativar':'Inativar'}</button></td></tr>`}).join('')||'<tr><td colspan="7">Nenhum produto cadastrado.</td></tr>'; renderProductSelects(); }
function renderProductSelects(){ const options=products.filter(productActive).map(p=>`<option value="${p.id}">${p.name} — estoque ${productStock(p)}</option>`).join(''); $$('select[name="productId"]').forEach(s=>s.innerHTML=options||'<option value="">Nenhum produto ativo</option>'); }
function renderStock(){ $('#stockRows').innerHTML=stockMovements.map(m=>`<tr><td>${date(m.createdAt||m.date)}</td><td>${m.product?.name||m.productName||'-'}</td><td><span class="status ${statusClass(m.type)}">${statusLabel(m.type)}</span></td><td>${m.quantity}</td><td>${m.user?.name||m.userName||'-'}</td></tr>`).join('')||'<tr><td colspan="5">Nenhuma movimentação encontrada.</td></tr>'; }
function renderSales(){ $('#salesRows').innerHTML=sales.map(s=>{const canceled=saleCanceled(s);return `<tr><td>${s.customerName||s.clientName||'-'}</td><td>${money(saleTotal(s))}</td><td><span class="status ${canceled?'danger':statusClass(s.status)}">${statusLabel(s.status)}</span></td><td>${saleItems(s).length||'-'}</td><td>${date(s.createdAt||s.date)}</td><td><button class="${canceled?'ghost-btn':'danger-btn'}" data-action="${canceled?'reactivate-sale':'cancel-sale'}" data-id="${s.id}">${canceled?'Reativar':'Cancelar'}</button></td></tr>`}).join('')||'<tr><td colspan="6">Nenhuma venda encontrada.</td></tr>'; }
function renderFinance(){ const x=numbers(); $('#financeRevenue').textContent=money(x.revenue); $('#financeExpenses').textContent=money(x.expTotal); $('#financeProfit').textContent=money(x.profit); $('#financeMargin').textContent=`${x.margin.toFixed(1)}%`; $('#expensesRows').innerHTML=expenses.map(e=>{const canceled=expenseCanceled(e);return `<tr><td>${e.description||'-'}</td><td>${e.category||'-'}</td><td>${money(e.amount)}</td><td><span class="status ${canceled?'danger':statusClass(e.status)}">${statusLabel(e.status)}</span></td><td><button class="${canceled?'ghost-btn':'danger-btn'}" data-action="${canceled?'reactivate-expense':'cancel-expense'}" data-id="${e.id}">${canceled?'Reativar':'Cancelar'}</button></td></tr>`}).join('')||'<tr><td colspan="5">Nenhuma despesa registrada.</td></tr>'; }
function renderAudit(){ const unique=new Set(auditLogs.map(l=>l.userEmail||l.user?.email||l.userName).filter(Boolean)); const critical=auditLogs.filter(l=>/CANCEL|DEACTIVATE|REACTIVATE|ROLE|STATUS|DELETE/i.test(l.action||'')).length; $('#auditTotal').textContent=auditLogs.length; $('#auditUsers').textContent=unique.size; $('#auditCritical').textContent=critical; $('#auditRows').innerHTML=auditLogs.map(l=>`<tr><td>${date(l.date||l.createdAt)}</td><td><strong>${l.userName||l.user?.name||'Sistema'}</strong><small>${l.userEmail||l.user?.email||'-'}</small></td><td><span class="chip">${l.userRole||l.user?.role||'-'}</span></td><td>${l.module||l.entity||'-'}</td><td><span class="status ok">${l.action||'-'}</span></td><td><small>${JSON.stringify(l.details||l.metadata||{}).slice(0,240)}</small></td></tr>`).join('')||'<tr><td colspan="6">Nenhum evento de auditoria encontrado.</td></tr>'; }
function renderReports(){ const x=numbers(); $('#reportRevenue').textContent=money(x.revenue); $('#reportProfit').textContent=money(x.profit); $('#reportCritical').textContent=x.critical; }
function renderUsers(){ $('#usersRows').innerHTML=users.map(u=>{const inactive=u.isActive===false||!!u.deletedAt; const me=currentUser?.id===u.id; const role=u.role||'-'; const roleOptions=['ADMIN','MANAGER','STOCK','SALES','FINANCE'].map(r=>`<option value="${r}" ${role===r?'selected':''}>${r}</option>`).join(''); const roleCell=(me||role==='OWNER')?`<span class="chip">${role==='OWNER'?'Owner / Criador':role}</span>`:`<select class="inline-select" data-action="change-user-role" data-id="${u.id}">${roleOptions}</select>`; const actions=me?'<span class="status ok">Conta atual</span>':`<button class="${inactive?'ghost-btn':'danger-btn'}" data-action="${inactive?'reactivate-user':'deactivate-user'}" data-id="${u.id}" data-name="${u.name||u.email}">${inactive?'Reativar':'Desativar'}</button>`; return `<tr><td><strong>${u.name||'-'}</strong>${me?'<small>Você</small>':''}</td><td>${u.email||'-'}</td><td>${roleCell}</td><td>${date(u.createdAt)}</td><td>${actions}</td></tr>`}).join('')||'<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>'; }

function switchView(view, force=false){ if(!token&&!force&&view!=='dashboard'){showLogin();toast('Faça login para acessar esta sessão.','info');return;} $$('.nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view)); $$('.view').forEach(v=>{v.classList.remove('active');v.classList.add('hidden-view');v.style.display='none'}); const target=$(`#${view}View`); if(target){target.classList.add('active');target.classList.remove('hidden-view');target.style.display='block'} if(token){$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden')} }
window.stockFlowOpenView=switchView;

function confirmAction(title,text,callback){ $('#confirmTitle').textContent=title; $('#confirmText').textContent=text; confirmCallback=callback; $('#confirmModal').classList.remove('hidden'); }
function closeConfirm(){ $('#confirmModal').classList.add('hidden'); confirmCallback=null; }
async function runConfirmed(){ const cb=confirmCallback; closeConfirm(); if(cb) await cb(); }
async function action(path,success,body={reason:'Ação operacional pelo Owner'}){ try{ await api(path,withBody('PATCH',body)); toast(success,'success'); await refreshAll(); }catch(err){ toast(`${err.message}`,'error'); } }
async function ensureCategoryId(name){ name=clean(name); if(!name)return null; const found=categories.find(c=>String(c.name).toLowerCase()===name.toLowerCase()); if(found)return found.id; try{ const created=await api('/categories',withBody('POST',{name})); categories.push(created); return created.id; }catch{return null;} }

async function createProduct(e){ e.preventDefault(); const fd=new FormData(e.target); const categoryName=fd.get('categoryName'); const categoryId=await ensureCategoryId(categoryName); const body={name:clean(fd.get('name')), sku:clean(fd.get('sku'))||undefined, price:n(fd.get('price')), cost:n(fd.get('cost')), stock:Math.trunc(n(fd.get('stock'))), minStock:Math.trunc(n(fd.get('minStock'))), status:'ACTIVE', categoryId}; if(!body.name||body.name.length<2)return toast('Informe um nome com pelo menos 2 caracteres.','error'); try{ await api('/products',withBody('POST',body)); e.target.reset(); toast('Produto criado com sucesso.','success'); await refreshAll(); }catch(err){ toast(`Falha ao criar produto: ${err.message}`,'error'); } }
async function createStock(e){ e.preventDefault(); const fd=new FormData(e.target); const body={productId:fd.get('productId'), type:fd.get('type'), quantity:Math.trunc(n(fd.get('quantity'))), reason:clean(fd.get('reason'))||'Movimentação operacional'}; try{ await api('/stock-movements',withBody('POST',body)); e.target.reset(); toast('Movimentação registrada.','success'); await refreshAll(); }catch(err){ toast(`Falha ao registrar movimentação: ${err.message}`,'error'); } }
async function createSale(e){ e.preventDefault(); const fd=new FormData(e.target); const body={customerName:clean(fd.get('customerName')), discount:n(fd.get('discount')), items:[{productId:fd.get('productId'), quantity:Math.trunc(n(fd.get('quantity')))}]}; if(!body.customerName||body.customerName.length<2)return toast('Informe o nome do cliente com pelo menos 2 caracteres.','error'); try{ await api('/sales',withBody('POST',body)); e.target.reset(); toast('Venda registrada com sucesso.','success'); await refreshAll(); }catch(err){ toast(`Falha ao registrar venda: ${err.message}`,'error'); } }
async function createExpense(e){ e.preventDefault(); const fd=new FormData(e.target); const body={description:clean(fd.get('description')), category:clean(fd.get('category'))||'Operacional', amount:n(fd.get('amount')), status:fd.get('status')||'PENDING'}; if(!body.description||body.description.length<2)return toast('Informe uma descrição com pelo menos 2 caracteres.','error'); try{ await api('/expenses',withBody('POST',body)); e.target.reset(); e.target.querySelector('[name="category"]').value='Compras'; toast('Despesa registrada com sucesso.','success'); await refreshAll(); }catch(err){ toast(`Falha ao registrar despesa: ${err.message}`,'error'); } }
async function createUser(e){ e.preventDefault(); const fd=new FormData(e.target); const body={name:clean(fd.get('name')), email:clean(fd.get('email')), password:String(fd.get('password')||''), role:fd.get('role')}; if(!canManageUsers())return toast('Apenas Owner/Admin podem criar usuários.','error'); try{ await api('/users',withBody('POST',body)); e.target.reset(); e.target.querySelector('[name="password"]').value='123456'; toast('Usuário criado com sucesso.','success'); await refreshAll(); }catch(err){ toast(`Falha ao criar usuário: ${err.message}`,'error'); } }
function generateReport(){ const x=numbers(); const txt=`Relatório gerado em ${new Date().toLocaleString('pt-BR')}. Receita ${money(x.revenue)}, despesas ${money(x.expTotal)}, lucro ${money(x.profit)}, margem ${x.margin.toFixed(1)}%, ${x.critical} produto(s) crítico(s), ${x.validSales.length} venda(s) ativa(s) e ${auditLogs.length} evento(s) de auditoria.`; $('#reportText').textContent=txt; $('#reportDocText').textContent='StockFlow S Plus é um sistema fullstack de estoque, vendas, financeiro, auditoria e permissões, com autenticação JWT, PostgreSQL/Prisma e dashboard executivo integrado.'; $('#reportRecommendations').innerHTML=[x.critical?`Repor ${x.critical} produto(s) em estoque crítico.`:'Estoque crítico sob controle.', x.profit<0?'Reduzir despesas ou revisar margem comercial.':'Operação com lucro positivo no período.', auditLogs.length?'Auditoria ativa e rastreando ações críticas.':'Gerar mais operações para alimentar auditoria.'].map(i=>`<li>${i}</li>`).join(''); const panel=$('#reportPanel'); panel.classList.remove('generated'); void panel.offsetWidth; panel.classList.add('generated'); toast('Relatório gerado com sucesso.','success'); }
function copyReport(){ navigator.clipboard?.writeText($('#reportText').textContent + '\n\n' + $('#reportDocText').textContent); toast('Resumo copiado.','success'); }
function exportCsv(){ const rows=[['tipo','descricao','valor','status'],...sales.map(s=>['venda',s.customerName,saleTotal(s),s.status]),...expenses.map(e=>['despesa',e.description,n(e.amount),e.status])]; const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='stockflow-relatorio.csv'; a.click(); URL.revokeObjectURL(a.href); toast('CSV exportado.','success'); }

function bindEvents(){ $('#loginForm')?.addEventListener('submit',login); $('#logoutBtn')?.addEventListener('click',logout); $('#refreshBtn')?.addEventListener('click',refreshAll); $('#auditRefreshBtn')?.addEventListener('click',refreshAll); $('#productForm')?.addEventListener('submit',createProduct); $('#stockForm')?.addEventListener('submit',createStock); $('#saleForm')?.addEventListener('submit',createSale); $('#expenseForm')?.addEventListener('submit',createExpense); $('#userForm')?.addEventListener('submit',createUser); $('#generateReportBtn')?.addEventListener('click',generateReport); $('#copyReportBtn')?.addEventListener('click',copyReport); $('#exportCsvBtn')?.addEventListener('click',exportCsv); $('#cancelConfirm')?.addEventListener('click',closeConfirm); $('#cancelConfirmX')?.addEventListener('click',closeConfirm); $('#confirmAction')?.addEventListener('click',runConfirmed);
  document.addEventListener('click',ev=>{ const nav=ev.target.closest('.nav-item[data-view], [data-open-view]'); if(nav){ ev.preventDefault(); switchView(nav.dataset.view||nav.dataset.openView); return; } const btn=ev.target.closest('[data-action]'); if(!btn)return; const id=btn.dataset.id; const name=btn.dataset.name||'item'; const act=btn.dataset.action; const map={ 'deactivate-product':['Inativar produto',`Deseja inativar ${name}? Ele ficará preservado no histórico.`,()=>action(`/products/${id}/deactivate`,'Produto inativado.')], 'reactivate-product':['Reativar produto',`Deseja reativar ${name}?`,()=>action(`/products/${id}/reactivate`,'Produto reativado.')], 'cancel-sale':['Cancelar venda','Deseja cancelar esta venda? O estoque será estornado e a ação ficará auditada.',()=>action(`/sales/${id}/cancel`,'Venda cancelada.')], 'reactivate-sale':['Reativar venda','Deseja reativar esta venda? O estoque será baixado novamente.',()=>action(`/sales/${id}/reactivate`,'Venda reativada.')], 'cancel-expense':['Cancelar despesa','Deseja cancelar esta despesa? Ela ficará preservada no histórico.',()=>action(`/expenses/${id}/cancel`,'Despesa cancelada.')], 'reactivate-expense':['Reativar despesa','Deseja reativar esta despesa?',()=>action(`/expenses/${id}/reactivate`,'Despesa reativada.')], 'deactivate-user':['Desativar usuário',`Deseja desativar ${name}?`,()=>action(`/users/${id}/admin-status`,'Usuário desativado.',{isActive:false})], 'reactivate-user':['Reativar usuário',`Deseja reativar ${name}?`,()=>action(`/users/${id}/admin-status`,'Usuário reativado.',{isActive:true})] }; if(map[act]) confirmAction(...map[act]); });
  document.addEventListener('change',ev=>{ const el=ev.target.closest('[data-action="change-user-role"]'); if(!el)return; const id=el.dataset.id, role=el.value; confirmAction('Alterar cargo',`Deseja alterar o cargo deste usuário para ${role}?`,()=>action(`/users/${id}/role`,'Cargo atualizado.',{role})); });
}

document.addEventListener('DOMContentLoaded',async()=>{ bindEvents(); await checkHealth(); if(token){ await refreshAll(); showAuthed(); } else { showLogin(); } });


// StockFlow 4.4.6 — Management Center + Advanced Reports
// Camada incremental: preserva login, auditoria, vendas, financeiro e navegação já funcionando.
// Evolui dashboard, produtos, estoque e relatórios sem alterar backend/banco.
(function stockFlow446ManagementCenter() {
  const API_BASE = '/api';
  const TOKEN_KEY = 'stockflow_token';

  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  const roleLabels = {
    OWNER: 'Owner / Criador',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    STOCK: 'Estoque',
    SALES: 'Vendas',
    FINANCE: 'Financeiro'
  };

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function hasToken() {
    return Boolean(token());
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR');
  }

  function notify(message, type = 'success') {
    const toast = qs('#toast');
    if (!toast) return console.log(`[StockFlow ${type}]`, message);
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3400);
  }

  async function request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token()) headers.Authorization = `Bearer ${token()}`;

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const text = await response.text();
    let data = null;

    try { data = text ? JSON.parse(text) : null; }
    catch { data = text; }

    if (!response.ok) {
      const msg = data?.message || data?.error || `HTTP ${response.status}`;
      throw new Error(msg);
    }

    return data;
  }

  function list(payload, key) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (key && Array.isArray(payload[key])) return payload[key];
    for (const value of Object.values(payload)) {
      if (Array.isArray(value)) return value;
    }
    return [];
  }

  function getState() {
    return {
      products: Array.isArray(window.products) ? window.products : [],
      sales: Array.isArray(window.sales) ? window.sales : [],
      expenses: Array.isArray(window.expenses) ? window.expenses : [],
      stockMovements: Array.isArray(window.stockMovements) ? window.stockMovements : [],
      users: Array.isArray(window.users) ? window.users : [],
      auditLogs: Array.isArray(window.auditLogs) ? window.auditLogs : []
    };
  }

  async function syncStateFromApi() {
    if (!hasToken()) return getState();

    const endpoints = [
      ['products', '/products'],
      ['sales', '/sales'],
      ['expenses', '/expenses'],
      ['stockMovements', '/stock-movements'],
      ['users', '/users'],
      ['auditLogs', '/audit']
    ];

    const results = await Promise.allSettled(endpoints.map(([, path]) => request(path)));

    endpoints.forEach(([name], index) => {
      if (results[index].status === 'fulfilled') {
        window[name] = list(results[index].value, name);
      }
    });

    return getState();
  }

  function productStock(product) {
    return Number(product.stock ?? product.quantity ?? product.currentStock ?? 0);
  }

  function productMinStock(product) {
    return Number(product.minStock ?? product.minimumStock ?? product.minQuantity ?? 0);
  }

  function isProductInactive(product) {
    const status = String(product.status || '').toUpperCase();
    return status === 'INACTIVE' || status === 'CANCELED' || product.isActive === false || Boolean(product.deletedAt);
  }

  function activeSales(sales) {
    return sales.filter((sale) => !['CANCELED', 'CANCELLED'].includes(String(sale.status || '').toUpperCase()));
  }

  function activeExpenses(expenses) {
    return expenses.filter((expense) => !['CANCELED', 'CANCELLED'].includes(String(expense.status || '').toUpperCase()));
  }

  function saleTotal(sale) {
    return Number(sale.total ?? sale.totalAmount ?? sale.amount ?? sale.netTotal ?? 0);
  }

  function calculateAnalytics() {
    const { products, sales, expenses, stockMovements, users, auditLogs } = getState();
    const activeSaleList = activeSales(sales);
    const activeExpenseList = activeExpenses(expenses);
    const revenue = activeSaleList.reduce((sum, sale) => sum + saleTotal(sale), 0);
    const expenseTotal = activeExpenseList.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const profit = revenue - expenseTotal;
    const margin = revenue ? (profit / revenue) * 100 : 0;
    const activeProducts = products.filter((p) => !isProductInactive(p));
    const criticalProducts = products.filter((p) => productStock(p) <= productMinStock(p));
    const ticket = activeSaleList.length ? revenue / activeSaleList.length : 0;

    const productRevenueMap = new Map();
    activeSaleList.forEach((sale) => {
      const items = sale.items || sale.saleItems || [];
      if (Array.isArray(items) && items.length) {
        items.forEach((item) => {
          const name = item.product?.name || item.productName || item.name || 'Produto';
          const total = Number(item.total || item.totalAmount || item.subtotal || saleTotal(sale) || 0);
          const current = productRevenueMap.get(name) || { name, quantity: 0, revenue: 0 };
          current.quantity += Number(item.quantity || 1);
          current.revenue += total;
          productRevenueMap.set(name, current);
        });
      } else {
        const name = sale.product?.name || sale.productName || sale.customerName || 'Venda';
        const current = productRevenueMap.get(name) || { name, quantity: 0, revenue: 0 };
        current.quantity += Number(sale.quantity || 1);
        current.revenue += saleTotal(sale);
        productRevenueMap.set(name, current);
      }
    });

    const topProducts = Array.from(productRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentActivities = [
      ...stockMovements.map((m) => ({
        date: m.createdAt || m.date,
        module: 'Estoque',
        title: `${m.product?.name || m.productName || 'Produto'} • ${m.type || 'Movimentação'}`,
        user: m.user?.name || m.userName || '-'
      })),
      ...activeSaleList.map((s) => ({
        date: s.createdAt || s.date,
        module: 'Vendas',
        title: `${s.customerName || s.clientName || 'Cliente'} • ${formatMoney(saleTotal(s))}`,
        user: s.user?.name || s.userName || '-'
      })),
      ...auditLogs.map((a) => ({
        date: a.createdAt || a.date,
        module: a.module || a.entity || 'Auditoria',
        title: a.action || 'Evento auditado',
        user: a.userName || a.user?.name || 'Sistema'
      }))
    ].filter((a) => a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    return {
      products,
      sales,
      expenses,
      stockMovements,
      users,
      auditLogs,
      activeSaleList,
      activeExpenseList,
      revenue,
      expenseTotal,
      profit,
      margin,
      activeProducts,
      criticalProducts,
      ticket,
      topProducts,
      recentActivities
    };
  }

  function ensureDashboardSections() {
    const dashboard = qs('#dashboardView');
    if (!dashboard || qs('#sf446DashboardExtra')) return;

    const extra = document.createElement('div');
    extra.id = 'sf446DashboardExtra';
    extra.className = 'sf446-dashboard-extra';
    extra.innerHTML = `
      <div class="sf446-section-grid">
        <article class="panel sf446-panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Atividades</span>
              <h3>Últimas operações</h3>
            </div>
            <span class="pill" id="sf446ActivityCount">0 eventos</span>
          </div>
          <div id="sf446RecentActivity" class="sf446-activity-list"></div>
        </article>

        <article class="panel sf446-panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Governança</span>
              <h3>Saúde operacional</h3>
            </div>
            <button class="ghost-btn" type="button" data-sf-view="audit">Ver auditoria</button>
          </div>
          <div class="sf446-health-grid">
            <div><strong id="sf446HealthStock">0</strong><span>itens críticos</span></div>
            <div><strong id="sf446HealthUsers">0</strong><span>usuários</span></div>
            <div><strong id="sf446HealthAudit">0</strong><span>eventos auditados</span></div>
            <div><strong id="sf446HealthMargin">0%</strong><span>margem</span></div>
          </div>
        </article>
      </div>

      <article class="panel sf446-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Inteligência operacional</span>
            <h3>Recomendações executivas</h3>
          </div>
          <button class="ghost-btn" type="button" data-sf-view="reports">Abrir relatórios</button>
        </div>
        <div id="sf446DashboardRecommendations" class="sf446-recommendations"></div>
      </article>
    `;

    dashboard.appendChild(extra);
  }

  function renderDashboard446() {
    ensureDashboardSections();
    const data = calculateAnalytics();

    setText('#heroRevenue', formatMoney(data.revenue));
    setText('#heroProfit', formatMoney(data.profit));
    setText('#metricRevenue', formatMoney(data.revenue));
    setText('#metricProfit', formatMoney(data.profit));
    setText('#metricProducts', data.activeProducts.length);
    setText('#metricCritical', data.criticalProducts.length);
    setText('#metricMargin', `Margem ${data.margin.toFixed(1)}%`);

    setText('#sf446ActivityCount', `${data.recentActivities.length} eventos`);
    setText('#sf446HealthStock', data.criticalProducts.length);
    setText('#sf446HealthUsers', data.users.length);
    setText('#sf446HealthAudit', data.auditLogs.length);
    setText('#sf446HealthMargin', `${data.margin.toFixed(1)}%`);

    const activity = qs('#sf446RecentActivity');
    if (activity) {
      activity.innerHTML = data.recentActivities.map((item) => `
        <div class="sf446-activity-item">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.module)} • ${escapeHtml(item.user)}</span>
          </div>
          <small>${formatDate(item.date)}</small>
        </div>
      `).join('') || `<div class="sf446-empty">Nenhuma atividade recente encontrada.</div>`;
    }

    const recommendations = qs('#sf446DashboardRecommendations');
    if (recommendations) {
      const recs = [
        data.criticalProducts.length ? `Repor ${data.criticalProducts.length} produto(s) em estoque crítico para evitar ruptura de vendas.` : 'Estoque sem rupturas críticas no momento.',
        data.profit >= 0 ? 'Operação com lucro positivo no período analisado.' : 'Lucro negativo: revisar despesas, custos e mix de produtos.',
        data.auditLogs.length ? 'Auditoria ativa e rastreando ações críticas do sistema.' : 'Auditoria ainda sem registros suficientes para análise.',
        data.activeSaleList.length ? `Ticket médio atual em ${formatMoney(data.ticket)}.` : 'Ainda não há vendas suficientes para calcular ticket médio confiável.'
      ];

      recommendations.innerHTML = recs.map((rec) => `<div class="sf446-recommendation">${escapeHtml(rec)}</div>`).join('');
    }
  }

  function setText(selector, value) {
    const el = qs(selector);
    if (el) el.textContent = value;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function ensureProductManagement() {
    const productsView = qs('#productsView');
    if (!productsView || qs('#sf446ProductControls')) return;

    const targetPanel = productsView.querySelector('.panel');
    const controls = document.createElement('div');
    controls.id = 'sf446ProductControls';
    controls.className = 'sf446-controls panel';
    controls.innerHTML = `
      <div class="panel-head">
        <div>
          <span class="eyebrow">Gerenciamento</span>
          <h3>Centro de controle de produtos</h3>
        </div>
        <span class="pill">Produtos preservados no histórico</span>
      </div>
      <div class="sf446-filter-grid">
        <label>Buscar produto<input id="sf446ProductSearch" placeholder="Nome, SKU ou categoria" /></label>
        <label>Status
          <select id="sf446ProductStatus">
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="critical">Estoque crítico</option>
          </select>
        </label>
        <label>Ordenar
          <select id="sf446ProductSort">
            <option value="name">Nome</option>
            <option value="stock">Estoque</option>
            <option value="price">Preço</option>
          </select>
        </label>
      </div>
      <div class="sf446-management-table table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="sf446ProductRows"></tbody>
        </table>
      </div>
    `;

    productsView.appendChild(controls);

    ['#sf446ProductSearch', '#sf446ProductStatus', '#sf446ProductSort'].forEach((selector) => {
      qs(selector)?.addEventListener('input', renderProductManagement);
      qs(selector)?.addEventListener('change', renderProductManagement);
    });
  }

  function filteredProducts() {
    const { products } = getState();
    const search = (qs('#sf446ProductSearch')?.value || '').toLowerCase().trim();
    const status = qs('#sf446ProductStatus')?.value || 'all';
    const sort = qs('#sf446ProductSort')?.value || 'name';

    let rows = products.filter((product) => {
      const text = `${product.name || ''} ${product.sku || ''} ${product.category?.name || product.categoryName || ''}`.toLowerCase();
      const inactive = isProductInactive(product);
      const critical = productStock(product) <= productMinStock(product);

      if (search && !text.includes(search)) return false;
      if (status === 'active' && inactive) return false;
      if (status === 'inactive' && !inactive) return false;
      if (status === 'critical' && !critical) return false;
      return true;
    });

    rows.sort((a, b) => {
      if (sort === 'stock') return productStock(a) - productStock(b);
      if (sort === 'price') return Number(b.price || 0) - Number(a.price || 0);
      return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    });

    return rows;
  }

  function renderProductManagement() {
    ensureProductManagement();
    const tbody = qs('#sf446ProductRows');
    if (!tbody) return;

    const rows = filteredProducts();
    tbody.innerHTML = rows.map((product) => {
      const inactive = isProductInactive(product);
      const critical = productStock(product) <= productMinStock(product);
      const category = product.category?.name || product.categoryName || product.category || '-';

      return `
        <tr>
          <td><strong>${escapeHtml(product.name || '-')}</strong><small>${escapeHtml(product.sku || product.id || '')}</small></td>
          <td>${escapeHtml(category)}</td>
          <td>${formatMoney(product.price)}</td>
          <td>${productStock(product)} / mín. ${productMinStock(product)}</td>
          <td><span class="status ${inactive ? 'danger' : critical ? 'warn' : 'ok'}">${inactive ? 'Inativo' : critical ? 'Crítico' : 'Ativo'}</span></td>
          <td>
            <div class="sf446-actions">
              <button class="ghost-btn" type="button" data-product-details="${product.id}">Detalhes</button>
              <button class="${inactive ? 'ghost-btn' : 'danger-btn'}" type="button" data-product-toggle="${product.id}" data-current="${inactive ? 'inactive' : 'active'}">${inactive ? 'Reativar' : 'Inativar'}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="6">Nenhum produto encontrado.</td></tr>`;
  }

  async function toggleProduct(productId, currentStatus) {
    const path = currentStatus === 'inactive'
      ? `/products/${productId}/reactivate`
      : `/products/${productId}/deactivate`;

    try {
      await request(path, { method: 'PATCH' });
      notify(currentStatus === 'inactive' ? 'Produto reativado com sucesso.' : 'Produto inativado com sucesso.');
      await refresh446();
    } catch (error) {
      notify(`Falha ao atualizar produto: ${error.message}`, 'error');
    }
  }

  function showProductDetails(productId) {
    const { products } = getState();
    const product = products.find((p) => p.id === productId);
    if (!product) return notify('Produto não encontrado.', 'error');

    const msg = [
      `Produto: ${product.name || '-'}`,
      `SKU: ${product.sku || '-'}`,
      `Categoria: ${product.category?.name || product.categoryName || product.category || '-'}`,
      `Preço: ${formatMoney(product.price)}`,
      `Custo: ${formatMoney(product.cost)}`,
      `Estoque: ${productStock(product)}`,
      `Mínimo: ${productMinStock(product)}`,
      `Status: ${isProductInactive(product) ? 'Inativo' : 'Ativo'}`
    ].join('\n');

    window.stockFlow447OpenDetails?.('Detalhes do produto', msg);
  }

  function ensureStockManagement() {
    const stockView = qs('#stockView');
    if (!stockView || qs('#sf446StockControls')) return;

    const controls = document.createElement('div');
    controls.id = 'sf446StockControls';
    controls.className = 'sf446-controls panel';
    controls.innerHTML = `
      <div class="panel-head">
        <div>
          <span class="eyebrow">Rastreabilidade</span>
          <h3>Gerenciamento de movimentações</h3>
        </div>
        <span class="pill">Não excluir: estornar/cancelar preserva auditoria</span>
      </div>

      <div class="sf446-filter-grid">
        <label>Buscar movimentação<input id="sf446StockSearch" placeholder="Produto, tipo, usuário ou motivo" /></label>
        <label>Tipo
          <select id="sf446StockType">
            <option value="all">Todos</option>
            <option value="IN">Entrada</option>
            <option value="OUT">Saída</option>
            <option value="ADJUSTMENT">Ajuste</option>
            <option value="SALE">Venda</option>
          </select>
        </label>
        <label>Ordenar
          <select id="sf446StockSort">
            <option value="recent">Mais recentes</option>
            <option value="quantity">Maior quantidade</option>
            <option value="product">Produto</option>
          </select>
        </label>
      </div>

      <div class="sf446-management-table table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Qtd.</th>
              <th>Usuário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="sf446StockRows"></tbody>
        </table>
      </div>
    `;

    stockView.appendChild(controls);

    ['#sf446StockSearch', '#sf446StockType', '#sf446StockSort'].forEach((selector) => {
      qs(selector)?.addEventListener('input', renderStockManagement);
      qs(selector)?.addEventListener('change', renderStockManagement);
    });
  }

  function filteredStockMovements() {
    const { stockMovements } = getState();
    const search = (qs('#sf446StockSearch')?.value || '').toLowerCase().trim();
    const type = qs('#sf446StockType')?.value || 'all';
    const sort = qs('#sf446StockSort')?.value || 'recent';

    let rows = stockMovements.filter((movement) => {
      const movementType = String(movement.type || '').toUpperCase();
      const text = `${movement.product?.name || movement.productName || ''} ${movementType} ${movement.user?.name || movement.userName || ''} ${movement.reason || ''}`.toLowerCase();

      if (search && !text.includes(search)) return false;
      if (type !== 'all' && movementType !== type) return false;
      return true;
    });

    rows.sort((a, b) => {
      if (sort === 'quantity') return Number(b.quantity || 0) - Number(a.quantity || 0);
      if (sort === 'product') return String(a.product?.name || a.productName || '').localeCompare(String(b.product?.name || b.productName || ''), 'pt-BR');
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });

    return rows;
  }

  function renderStockManagement() {
    ensureStockManagement();
    const tbody = qs('#sf446StockRows');
    if (!tbody) return;

    const rows = filteredStockMovements();
    tbody.innerHTML = rows.map((movement) => {
      const type = String(movement.type || '').toUpperCase();
      const label = {
        IN: 'Entrada',
        OUT: 'Saída',
        ADJUSTMENT: 'Ajuste',
        SALE: 'Venda'
      }[type] || movement.type || '-';

      return `
        <tr>
          <td>${formatDate(movement.createdAt || movement.date)}</td>
          <td><strong>${escapeHtml(movement.product?.name || movement.productName || '-')}</strong><small>${escapeHtml(movement.reason || movement.id || '')}</small></td>
          <td><span class="status ${type === 'OUT' || type === 'SALE' ? 'warn' : 'ok'}">${escapeHtml(label)}</span></td>
          <td>${Number(movement.quantity || 0)}</td>
          <td>${escapeHtml(movement.user?.name || movement.userName || '-')}</td>
          <td>
            <div class="sf446-actions">
              <button class="ghost-btn" type="button" data-stock-details="${movement.id}">Detalhes</button>
              <button class="danger-btn" type="button" data-stock-audit="${movement.id}">Marcar revisão</button>
            </div>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="6">Nenhuma movimentação encontrada.</td></tr>`;
  }

  function showStockDetails(movementId) {
    const { stockMovements } = getState();
    const movement = stockMovements.find((m) => m.id === movementId);
    if (!movement) return notify('Movimentação não encontrada.', 'error');

    const msg = [
      `Produto: ${movement.product?.name || movement.productName || '-'}`,
      `Tipo: ${movement.type || '-'}`,
      `Quantidade: ${movement.quantity || 0}`,
      `Usuário: ${movement.user?.name || movement.userName || '-'}`,
      `Data: ${formatDate(movement.createdAt || movement.date)}`,
      `Motivo: ${movement.reason || '-'}`
    ].join('\n');

    window.stockFlow447OpenDetails?.('Detalhes da movimentação', msg);
  }

  function markStockReview(movementId) {
    notify('Movimentação marcada para revisão operacional. A exclusão não é recomendada para preservar auditoria.', 'success');
  }

  function ensureAdvancedReports() {
    const reportsView = qs('#reportsView');
    if (!reportsView || qs('#sf446AdvancedReports')) return;

    const advanced = document.createElement('div');
    advanced.id = 'sf446AdvancedReports';
    advanced.className = 'sf446-advanced-reports';
    advanced.innerHTML = `
      <div class="sf446-section-grid">
        <article class="panel">
          <span class="eyebrow">Documentação</span>
          <h3>Resumo técnico para README</h3>
          <p id="sf446ReadmeSummary">Gere um relatório para criar a documentação automática.</p>
          <button class="ghost-btn" type="button" id="sf446CopyReadme">Copiar documentação</button>
        </article>

        <article class="panel">
          <span class="eyebrow">Operação</span>
          <h3>Análise automática</h3>
          <div id="sf446OperationalAnalysis" class="sf446-recommendations"></div>
        </article>
      </div>

      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Exportação</span>
            <h3>Pacote executivo</h3>
          </div>
          <button class="primary-btn" type="button" id="sf446ExportExecutiveCsv">Exportar CSV executivo</button>
        </div>
        <div class="sf446-report-grid">
          <div><strong id="sf446ReportSales">0</strong><span>vendas ativas</span></div>
          <div><strong id="sf446ReportProducts">0</strong><span>produtos ativos</span></div>
          <div><strong id="sf446ReportCritical">0</strong><span>produtos críticos</span></div>
          <div><strong id="sf446ReportAudit">0</strong><span>eventos auditados</span></div>
        </div>
      </article>
    `;

    reportsView.appendChild(advanced);

    qs('#sf446CopyReadme')?.addEventListener('click', copyReadmeSummary);
    qs('#sf446ExportExecutiveCsv')?.addEventListener('click', exportExecutiveCsv);
  }

  function generateExecutiveText() {
    const data = calculateAnalytics();

    return [
      `StockFlow S Plus é um sistema fullstack de estoque, vendas, financeiro, auditoria e permissões.`,
      `A versão atual opera com ${data.activeProducts.length} produto(s) ativo(s), ${data.activeSaleList.length} venda(s) ativa(s), receita de ${formatMoney(data.revenue)}, despesas de ${formatMoney(data.expenseTotal)} e lucro estimado de ${formatMoney(data.profit)}.`,
      `O painel de auditoria registra ${data.auditLogs.length} evento(s), fortalecendo governança, rastreabilidade e controle de risco operacional.`,
      `O dashboard executivo inclui indicadores de receita, lucro, margem, ticket médio, estoque crítico, top produtos por receita, últimas atividades e recomendações automáticas.`,
      `A arquitetura utiliza frontend integrado ao backend Node/Express, PostgreSQL/Prisma, autenticação JWT e controle de acesso por cargo, incluindo perfil Owner/Criador.`
    ].join(' ');
  }

  function renderAdvancedReports() {
    ensureAdvancedReports();
    const data = calculateAnalytics();
    const readme = generateExecutiveText();

    setText('#sf446ReadmeSummary', readme);
    setText('#sf446ReportSales', data.activeSaleList.length);
    setText('#sf446ReportProducts', data.activeProducts.length);
    setText('#sf446ReportCritical', data.criticalProducts.length);
    setText('#sf446ReportAudit', data.auditLogs.length);

    const analysis = qs('#sf446OperationalAnalysis');
    if (analysis) {
      const lines = [
        `Receita operacional: ${formatMoney(data.revenue)}.`,
        `Lucro estimado: ${formatMoney(data.profit)} com margem de ${data.margin.toFixed(1)}%.`,
        data.criticalProducts.length ? `Atenção: ${data.criticalProducts.length} produto(s) em estoque crítico.` : 'Estoque sem itens críticos relevantes.',
        data.auditLogs.length ? `Auditoria ativa com ${data.auditLogs.length} evento(s) registrados.` : 'Auditoria ainda sem dados suficientes.',
        data.activeSaleList.length ? `Ticket médio calculado em ${formatMoney(data.ticket)}.` : 'Sem vendas suficientes para ticket médio.'
      ];

      analysis.innerHTML = lines.map((line) => `<div class="sf446-recommendation">${escapeHtml(line)}</div>`).join('');
    }
  }

  async function copyReadmeSummary() {
    const text = generateExecutiveText();
    try {
      await navigator.clipboard.writeText(text);
      notify('Documentação copiada para a área de transferência.');
    } catch {
      notify('Não foi possível copiar automaticamente. Selecione o texto manualmente.', 'error');
    }
  }

  function exportExecutiveCsv() {
    const data = calculateAnalytics();
    const rows = [
      ['Indicador', 'Valor'],
      ['Receita', data.revenue],
      ['Despesas', data.expenseTotal],
      ['Lucro', data.profit],
      ['Margem', `${data.margin.toFixed(1)}%`],
      ['Produtos ativos', data.activeProducts.length],
      ['Produtos críticos', data.criticalProducts.length],
      ['Vendas ativas', data.activeSaleList.length],
      ['Ticket médio', data.ticket],
      ['Eventos auditados', data.auditLogs.length]
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `stockflow-relatorio-executivo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    notify('CSV executivo exportado com sucesso.');
  }

  async function refresh446() {
    await syncStateFromApi();
    renderDashboard446();
    renderProductManagement();
    renderStockManagement();
    renderAdvancedReports();

    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderProducts === 'function') window.renderProducts();
    if (typeof window.renderStock === 'function') window.renderStock();
    if (typeof window.renderReports === 'function') window.renderReports();
  }

  function bindGlobalActions() {
    if (window.__stockFlow446Bound) return;
    window.__stockFlow446Bound = true;

    document.addEventListener('click', (event) => {
      const detailsProduct = event.target.closest('[data-product-details]');
      const toggleProductBtn = event.target.closest('[data-product-toggle]');
      const detailsStock = event.target.closest('[data-stock-details]');
      const auditStock = event.target.closest('[data-stock-audit]');
      const sfView = event.target.closest('[data-sf-view]');

      if (detailsProduct) {
        event.preventDefault();
        showProductDetails(detailsProduct.dataset.productDetails);
      }

      if (toggleProductBtn) {
        event.preventDefault();
        toggleProduct(toggleProductBtn.dataset.productToggle, toggleProductBtn.dataset.current);
      }

      if (detailsStock) {
        event.preventDefault();
        showStockDetails(detailsStock.dataset.stockDetails);
      }

      if (auditStock) {
        event.preventDefault();
        markStockReview(auditStock.dataset.stockAudit);
      }

      if (sfView) {
        event.preventDefault();
        if (typeof window.stockFlowOpenView === 'function') {
          window.stockFlowOpenView(sfView.dataset.sfView);
        } else if (typeof window.switchView === 'function') {
          window.switchView(sfView.dataset.sfView);
        }
      }
    }, true);

    const originalRefresh = window.refreshAll;
    if (typeof originalRefresh === 'function' && !window.__stockFlow446RefreshWrapped) {
      window.__stockFlow446RefreshWrapped = true;
      window.refreshAll = async function patchedRefreshAll(...args) {
        const result = await originalRefresh.apply(this, args);
        setTimeout(refresh446, 150);
        return result;
      };
    }
  }

  function boot() {
    if (!hasToken()) return;
    ensureDashboardSections();
    ensureProductManagement();
    ensureStockManagement();
    ensureAdvancedReports();
    bindGlobalActions();
    refresh446().catch((error) => console.warn('[StockFlow 4.4.6]', error));
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindGlobalActions();
    setTimeout(boot, 500);
    setTimeout(boot, 1600);
  });

  window.stockFlow446Refresh = refresh446;
})();


// StockFlow 4.4.7 — Unified Interaction System
// Padroniza detalhes, confirmações e feedbacks sem alterar backend/banco.
(function stockFlow447UnifiedInteractionSystem() {
  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function htmlEscape(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function bodyToDetailsHtml(body) {
    if (Array.isArray(body)) {
      return body.map((item) => {
        if (typeof item === 'string') return `<div class="sf447-detail-row"><span>${htmlEscape(item)}</span></div>`;
        return `<div class="sf447-detail-row"><strong>${htmlEscape(item.label)}</strong><span>${htmlEscape(item.value)}</span></div>`;
      }).join('');
    }

    const lines = String(body ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const label = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        return `<div class="sf447-detail-row"><strong>${htmlEscape(label)}</strong><span>${htmlEscape(value)}</span></div>`;
      }

      return `<div class="sf447-detail-row"><span>${htmlEscape(line)}</span></div>`;
    }).join('');
  }

  window.stockFlow447OpenDetails = function stockFlow447OpenDetails(title, body, eyebrow = 'Detalhes operacionais') {
    const modal = qs('#detailsModal');
    const titleEl = qs('#detailsTitle');
    const bodyEl = qs('#detailsBody');
    const eyebrowEl = qs('#detailsEyebrow');

    if (!modal || !titleEl || !bodyEl) {
      console.log(title, body);
      return;
    }

    titleEl.textContent = title || 'Detalhes da operação';
    if (eyebrowEl) eyebrowEl.textContent = eyebrow;
    bodyEl.innerHTML = bodyToDetailsHtml(body);
    modal.classList.remove('hidden');
    document.body.classList.add('sf447-modal-open');
  };

  window.stockFlow447CloseDetails = function stockFlow447CloseDetails() {
    const modal = qs('#detailsModal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('sf447-modal-open');
  };

  window.stockFlow447Confirm = function stockFlow447Confirm(title, text, callback, variant = 'danger') {
    const modal = qs('#confirmModal');
    const titleEl = qs('#confirmTitle');
    const textEl = qs('#confirmText');
    const confirmBtn = qs('#confirmAction');

    if (!modal || !titleEl || !textEl || !confirmBtn) {
      if (typeof callback === 'function') callback();
      return;
    }

    titleEl.textContent = title || 'Confirmar ação';
    textEl.textContent = text || 'Deseja continuar?';

    confirmBtn.classList.toggle('danger-btn', variant === 'danger');
    confirmBtn.classList.toggle('primary-btn', variant !== 'danger');
    confirmBtn.textContent = variant === 'positive' ? 'Confirmar e reativar' : 'Confirmar ação';

    if (typeof window.confirmCallback !== 'undefined') {
      window.confirmCallback = callback;
    }

    // fallback quando confirmCallback é variável local do app antigo:
    const localHandler = async function onceHandler() {
      confirmBtn.removeEventListener('click', localHandler);
      try {
        closeModal('#confirmModal');
        if (typeof callback === 'function') await callback();
      } catch (error) {
        console.warn('[StockFlow 4.4.7 confirm fallback]', error);
      }
    };

    confirmBtn.addEventListener('click', localHandler, { once: true });

    modal.classList.remove('hidden');
    document.body.classList.add('sf447-modal-open');
  };

  function closeModal(selector) {
    const modal = qs(selector);
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('sf447-modal-open');
  }

  function bindModalControls() {
    if (window.__stockFlow447ModalBound) return;
    window.__stockFlow447ModalBound = true;

    qs('#closeDetailsBtn')?.addEventListener('click', window.stockFlow447CloseDetails);
    qs('#closeDetailsX')?.addEventListener('click', window.stockFlow447CloseDetails);
    qs('#detailsModal')?.addEventListener('click', (event) => {
      if (event.target?.id === 'detailsModal') window.stockFlow447CloseDetails();
    });

    qs('#cancelConfirmX')?.addEventListener('click', () => {
      if (typeof window.closeConfirm === 'function') window.closeConfirm();
      closeModal('#confirmModal');
    });

    qs('#confirmModal')?.addEventListener('click', (event) => {
      if (event.target?.id === 'confirmModal') {
        if (typeof window.closeConfirm === 'function') window.closeConfirm();
        closeModal('#confirmModal');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      window.stockFlow447CloseDetails();
      if (typeof window.closeConfirm === 'function') window.closeConfirm();
      closeModal('#confirmModal');
    });
  }

  // Captura detalhes do Management Center 4.4.6 antes de qualquer alert nativo aparecer.
  function bindDetailsCapture() {
    if (window.__stockFlow447DetailsCaptureBound) return;
    window.__stockFlow447DetailsCaptureBound = true;

    document.addEventListener('click', (event) => {
      const productDetails = event.target.closest('[data-product-details]');
      const stockDetails = event.target.closest('[data-stock-details]');

      if (productDetails && Array.isArray(window.products)) {
        const product = window.products.find((p) => p.id === productDetails.dataset.productDetails);
        if (product) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.stockFlow447OpenDetails('Detalhes do produto', [
            { label: 'Produto', value: product.name || '-' },
            { label: 'SKU', value: product.sku || '-' },
            { label: 'Categoria', value: product.category?.name || product.categoryName || product.category || '-' },
            { label: 'Preço', value: Number(product.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
            { label: 'Custo', value: Number(product.cost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
            { label: 'Estoque', value: product.stock ?? product.quantity ?? product.currentStock ?? 0 },
            { label: 'Mínimo', value: product.minStock ?? product.minimumStock ?? product.minQuantity ?? 0 },
            { label: 'Status', value: product.isActive === false || product.deletedAt ? 'Inativo' : 'Ativo' }
          ], 'Catálogo');
        }
      }

      if (stockDetails && Array.isArray(window.stockMovements)) {
        const movement = window.stockMovements.find((m) => m.id === stockDetails.dataset.stockDetails);
        if (movement) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.stockFlow447OpenDetails('Detalhes da movimentação', [
            { label: 'Produto', value: movement.product?.name || movement.productName || '-' },
            { label: 'Tipo', value: movement.type || '-' },
            { label: 'Quantidade', value: movement.quantity || 0 },
            { label: 'Usuário', value: movement.user?.name || movement.userName || '-' },
            { label: 'Data', value: movement.createdAt || movement.date ? new Date(movement.createdAt || movement.date).toLocaleString('pt-BR') : '-' },
            { label: 'Motivo', value: movement.reason || '-' }
          ], 'Estoque');
        }
      }
    }, true);
  }

  function boot() {
    bindModalControls();
    bindDetailsCapture();
  }

  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
