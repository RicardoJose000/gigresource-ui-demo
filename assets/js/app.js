(function () {
  'use strict';
  const D = window.GR;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const params = new URLSearchParams(location.search);
  const EMBED = params.get('embed') === '1';
  if (EMBED) document.documentElement.classList.add('embed');

  const app = $('#app'), nav = $('#sbNav'), page = $('#page'), tip = $('#tip');
  const st = { role: null, page: null, tab: 0, view: 'default' };
  const pref = { desktopCollapsed: false, laptopExpanded: false };
  let cleanups = [];
  let lastBar = null;

  /* ================= helpers ================= */
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => Math.floor(a + r() * (b - a + 1));
  const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const ic = (n, c = '') => `<i data-lucide="${n}"${c ? ` class="${c}"` : ''}></i>`;
  const icons = () => window.lucide && lucide.createIcons();
  const role = () => D.roles[st.role];
  const others = () => D.people.filter(p => p.id !== role().user.id);
  const COLORS = { teal: '#2dd4bf', purple: '#8b5cf6', orange: '#fb923c', green: '#22c55e', navy: '#6d8bff' };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = (r) => `${pick(r, months.slice(8, 11))} ${int(r, 1, 28)}`;
  const pill = (txt, c) => `<span class="pill p-${c}">${txt}</span>`;
  const person = (p, sub) => `<div class="cell-p"><img src="${p.av}" alt="" loading="lazy"><span><b>${p.name}</b><small>${sub || p.title}</small></span></div>`;
  const sq = (txt, c) => `<span class="sq" style="background:${c}22;color:${c}">${txt}</span>`;
  const findItem = (r, id) => { for (const g of D.roles[r].nav) for (const it of g.items) if (it.id === id) return it; return null; };

  /* ================= sidebar mode ================= */
  function computeMode() {
    const w = window.innerWidth;
    if (w < 768) return 'drawer';
    if (w < 1440) return pref.laptopExpanded ? 'overlay' : 'collapsed';
    return pref.desktopCollapsed ? 'collapsed' : 'expanded';
  }
  function applyMode() {
    const m = computeMode();
    app.dataset.sb = m;
    $('#sbToggle').setAttribute('aria-label', m === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar');
    if (m !== 'drawer') app.classList.remove('drawer-open');
    hideTip();
    setTimeout(moveInd, 470);
  }
  let lastBand = null;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const band = w < 768 ? 0 : w < 1440 ? 1 : 2;
    if (band !== lastBand) { pref.laptopExpanded = false; lastBand = band; applyMode(); }
    moveInd();
    positionTabBar(false);
  });
  $('#sbToggle').addEventListener('click', () => {
    if (window.innerWidth >= 1440) pref.desktopCollapsed = !pref.desktopCollapsed;
    else pref.laptopExpanded = !pref.laptopExpanded;
    applyMode();
  });
  $('#burger').addEventListener('click', () => { app.classList.add('drawer-open'); setTimeout(moveInd, 50); });
  $('#sbClose').addEventListener('click', () => app.classList.remove('drawer-open'));
  $('#scrim').addEventListener('click', closeNav);
  function closeNav() {
    if (app.dataset.sb === 'overlay') { pref.laptopExpanded = false; applyMode(); }
    app.classList.remove('drawer-open');
  }

  function moveInd() {
    const ind = $('#sbInd'), on = $('.nav-item.on', nav);
    if (!ind) return;
    if (!on) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.height = on.offsetHeight + 'px';
    ind.style.transform = `translateY(${on.offsetTop}px)`;
  }

  /* tooltips for the collapsed rail */
  function showTip(el) {
    if (app.dataset.sb !== 'collapsed') return;
    const r = el.getBoundingClientRect();
    tip.textContent = el.dataset.label;
    tip.style.left = r.right + 14 + 'px';
    tip.style.top = r.top + r.height / 2 - 15 + 'px';
    tip.classList.add('show');
  }
  function hideTip() { tip.classList.remove('show'); }
  ['mouseover', 'focusin'].forEach(ev => $('#sb').addEventListener(ev, e => {
    const el = e.target.closest('[data-label]');
    if (el) showTip(el); else hideTip();
  }));
  $('#sb').addEventListener('mouseleave', hideTip);
  $('#sb').addEventListener('focusout', hideTip);

  /* ================= sidebar render ================= */
  function renderSidebar() {
    const R = role();
    document.documentElement.style.setProperty('--accent', R.color);
    const ri = $('#roleIco');
    ri.textContent = R.short;
    ri.style.background = R.color;
    $('#roleName').textContent = R.name;
    $('#roleSub').textContent = R.user.name;
    $('#roleBtn').dataset.label = R.name + ' account';
    nav.innerHTML = '<div class="sb-ind" id="sbInd"></div>' + R.nav.map(g =>
      `<div class="sb-grp">${g.label}</div>` + g.items.map(it =>
        `<a class="nav-item" href="#/${st.role}/${it.id}" data-id="${it.id}" data-label="${it.label}">${ic(it.icon)}<span class="lbl">${it.label}</span>${it.badge ? `<span class="badge">${it.badge}</span>` : ''}</a>`
      ).join('')
    ).join('');
    $('#meAv').src = R.user.av;
    $('#topAv').src = R.user.av;
    $('#meName').textContent = R.user.name;
    $('#meSub').textContent = R.user.sub;
    $('#promoTitle').textContent = R.promo[0];
    $('#promoText').textContent = R.promo[1];
    $('#promoCta').textContent = R.promo[2];
    $('#promoCta').dataset.toast = R.promo[3];
    $('#crumbRole').textContent = R.name;
    $('#roleMenu').innerHTML = '<small>Switch user type</small>' + Object.entries(D.roles).map(([k, r]) =>
      `<button class="role-opt${k === st.role ? ' on' : ''}" role="menuitem" data-role="${k}"><i class="d" style="background:${r.color}">${r.short}</i><span><b>${r.name}</b><em>${r.desc}</em></span>${ic('check', 'ok')}</button>`
    ).join('');
    icons();
    if (window.gsap) gsap.from($$('.nav-item', nav), { x: -14, opacity: 0, duration: .5, stagger: .025, ease: 'power3.out', clearProps: 'all' });
  }

  // role menu
  const roleMenu = $('#roleMenu'), roleBtn = $('#roleBtn');
  roleBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !roleMenu.classList.contains('open');
    roleMenu.classList.toggle('open', open);
    roleBtn.setAttribute('aria-expanded', open);
    hideTip();
  });
  roleMenu.addEventListener('click', e => {
    const b = e.target.closest('.role-opt');
    if (!b) return;
    roleMenu.classList.remove('open');
    location.hash = `#/${b.dataset.role}/dashboard`;
  });

  // notifications
  const notif = $('#notif');
  notif.innerHTML = `<header>Notifications <a href="#" data-toast="All caught up">Mark all read</a></header>` +
    D.notifications.map(n => `<div class="n${n.u ? ' unread' : ''}"><img src="${D.P(n.p).av}" alt=""><div>${n.t}<small>${n.s}</small></div></div>`).join('');
  $('#bell').addEventListener('click', e => { e.stopPropagation(); notif.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (!e.target.closest('.sb-role')) roleMenu.classList.remove('open');
    if (!e.target.closest('#notif') && !e.target.closest('#bell')) notif.classList.remove('open');
  });

  /* ================= router ================= */
  function parse() {
    const m = location.hash.match(/^#\/(\w+)\/([\w-]+)(?:\/(\d+))?/);
    return m ? { r: m[1], p: m[2], t: +(m[3] || 0) } : null;
  }
  function route() {
    let h = parse();
    if (!h || !D.roles[h.r] || !findItem(h.r, h.p)) {
      const r = D.roles[params.get('role')] ? params.get('role') : (h && D.roles[h.r] ? h.r : 'client');
      history.replaceState(null, '', `#/${r}/dashboard`);
      h = { r, p: 'dashboard', t: 0 };
    }
    const roleChanged = h.r !== st.role, pageChanged = h.p !== st.page || roleChanged;
    st.role = h.r; st.page = h.p; st.tab = h.t;
    if (pageChanged) { setView('default', false); lastBar = null; }
    if (roleChanged) renderSidebar();
    $$('.nav-item', nav).forEach(a => a.classList.toggle('on', a.dataset.id === st.page));
    moveInd();
    const it = findItem(st.role, st.page);
    $('#crumbPage').textContent = it.label;
    document.title = `${it.label} | GigResource ${role().name}`;
    renderPage(pageChanged);
    if (pageChanged) {
      if (app.dataset.sb === 'overlay') { pref.laptopExpanded = false; applyMode(); }
      app.classList.remove('drawer-open');
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener('hashchange', route);

  /* ================= state dock ================= */
  function setView(v, rerender = true) {
    st.view = v;
    $$('#dock button').forEach(b => b.classList.toggle('on', b.dataset.state === v));
    if (rerender) renderPage(false);
  }
  $('#dock').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) setView(b.dataset.state);
  });

  /* ================= page render ================= */
  function cleanup() { cleanups.forEach(fn => { try { fn(); } catch (e) {} }); cleanups = []; }

  function renderPage(animate) {
    cleanup();
    const it = findItem(st.role, st.page);
    const out = TPL[it.tpl](it, role());
    let body = out.body;
    if (st.view !== 'default') body = stateView(st.view, it);
    page.innerHTML = out.head + body;
    icons();
    positionTabBar(true);
    if (st.view === 'default' && out.mount) out.mount();
    mountCommon();
    const blocks = $$('.anim', page);
    if (window.gsap && blocks.length) {
      gsap.fromTo(blocks, { y: animate ? 22 : 10, opacity: 0 }, { y: 0, opacity: 1, duration: animate ? .7 : .45, stagger: animate ? .06 : .03, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
  }

  function header(it, sub, actions = '') {
    return `<div class="ph anim"><div><h1>${it.label}</h1><p>${sub}</p></div><div class="ph-actions">${actions}</div></div>`;
  }
  function tabs(list) {
    return `<div class="tabs anim" role="tablist">${list.map((t, i) => {
      const [label, cnt] = Array.isArray(t) ? t : [t, null];
      return `<button class="tab${i === st.tab ? ' on' : ''}" role="tab" aria-selected="${i === st.tab}" data-tab="${i}">${label}${cnt !== null ? `<span class="cnt">${cnt}</span>` : ''}</button>`;
    }).join('')}<span class="tab-bar" id="tabBar"></span></div>`;
  }
  function positionTabBar(fromLast) {
    const bar = $('#tabBar'), on = $('.tab.on', page);
    if (!bar || !on) return;
    const to = { left: on.offsetLeft, width: on.offsetWidth };
    if (fromLast && lastBar) {
      bar.style.transition = 'none';
      bar.style.left = lastBar.left + 'px';
      bar.style.width = lastBar.width + 'px';
      bar.offsetWidth;
      bar.style.transition = '';
    }
    bar.style.left = to.left + 'px';
    bar.style.width = to.width + 'px';
    lastBar = to;
  }
  function actionBtn(a) {
    if (!a) return '';
    const attr = a.modal ? `data-modal="${a.modal}"` : a.route ? `data-go="${a.route}"` : `data-toast="${a.toast}"`;
    return `<button class="btn btn-p" ${attr}>${ic(a.icon || 'plus')}${a.label}</button>`;
  }

  /* ================= state views ================= */
  const ILL_EMPTY = `<svg class="ill" viewBox="0 0 170 120" fill="none"><ellipse cx="85" cy="108" rx="60" ry="7" fill="rgba(45,212,191,.08)"/><rect x="30" y="34" width="110" height="70" rx="14" fill="#111a3c" stroke="#26336a"/><path d="M30 58h110" stroke="#26336a"/><rect x="44" y="20" width="82" height="20" rx="7" fill="#18234d" stroke="#26336a"/><circle cx="85" cy="80" r="15" fill="rgba(45,212,191,.12)" stroke="#2dd4bf" stroke-width="2"/><path d="M79 80h12M85 74v12" stroke="#2dd4bf" stroke-width="2.4" stroke-linecap="round"/><circle cx="148" cy="22" r="5" fill="#fb923c"/><circle cx="20" cy="70" r="4" fill="#8b5cf6"/><path d="M150 50l3 3m0-3l-3 3" stroke="#6d8bff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  const ILL_ERR = `<svg class="ill" viewBox="0 0 170 120" fill="none"><ellipse cx="85" cy="108" rx="60" ry="7" fill="rgba(248,113,113,.08)"/><path d="M20 70h38" stroke="#26336a" stroke-width="6" stroke-linecap="round"/><rect x="56" y="54" width="26" height="32" rx="7" fill="#18234d" stroke="#f87171" stroke-width="2"/><path d="M82 62h8M82 78h8" stroke="#f87171" stroke-width="3" stroke-linecap="round"/><rect x="100" y="54" width="26" height="32" rx="7" fill="#18234d" stroke="#26336a" stroke-width="2"/><path d="M126 70h26" stroke="#26336a" stroke-width="6" stroke-linecap="round"/><path d="M94 46l-4 8 6-2-4 8" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function emptyState(t, p, cta) {
    return `<div class="card anim"><div class="state">${ILL_EMPTY}<h3>${t}</h3><p>${p}</p><div class="row">${cta || ''}</div></div></div>`;
  }
  function stateView(v, it) {
    if (v === 'empty') return emptyState(`Nothing in ${it.label} yet`, 'When there is activity it shows up here. This is the empty state every page gets.', actionBtn(role().primary));
    if (v === 'error') return `<div class="card anim"><div class="state err">${ILL_ERR}<h3>We could not load ${it.label}</h3><p>The connection dropped for a moment. Nothing was lost. Try again, or check back in a minute.</p><div class="row"><button class="btn btn-p" data-view="default">${ic('rotate-cw')}Try again</button><button class="btn btn-g" data-toast="Support ticket opened">Contact support</button></div></div></div>`;
    return skeleton(it.tpl);
  }
  function skeleton(tpl) {
    const sk = (h, w = '100%', r = 10) => `<div class="sk" style="height:${h}px;width:${w};border-radius:${r}px"></div>`;
    if (tpl === 'dashboard') return `<div class="anim">${sk(210, '100%', 22)}</div><div class="grid g-kpi mt anim">${sk(130, '100%', 18).repeat(4)}</div><div class="grid g-2-1 mt anim">${sk(360, '100%', 18)}${sk(360, '100%', 18)}</div>`;
    if (tpl === 'cards') return `<div class="gcards anim">${`<div class="card" style="padding:0;overflow:hidden">${sk(170, '100%', 0)}<div style="padding:16px;display:grid;gap:10px">${sk(14, '70%')}${sk(10, '90%')}${sk(10, '60%')}</div></div>`.repeat(6)}</div>`;
    if (tpl === 'messages') return `<div class="card anim" style="display:grid;grid-template-columns:300px 1fr;gap:0;height:520px;overflow:hidden"><div style="padding:14px;display:grid;gap:12px;align-content:start;border-right:1px solid var(--line)">${`<div style="display:flex;gap:10px;align-items:center">${sk(42, '42px', 21)}<div style="flex:1;display:grid;gap:6px">${sk(10, '60%')}${sk(8, '85%')}</div></div>`.repeat(6)}</div><div style="padding:20px;display:grid;gap:14px;align-content:start">${sk(40, '55%', 14)}${sk(40, '40%', 14)}${sk(60, '62%', 14)}</div></div>`;
    return `<div class="anim" style="display:flex;gap:10px;margin-bottom:16px">${sk(40, '260px', 11)}${sk(36, '90px', 18)}${sk(36, '90px', 18)}</div><div class="card anim" style="padding:16px;display:grid;gap:14px">${`<div style="display:flex;gap:14px;align-items:center">${sk(34, '34px', 17)}${sk(12, '30%')}${sk(12, '14%')}${sk(22, '80px', 11)}${sk(12, '12%')}</div>`.repeat(7)}</div>`;
  }

  /* ================= tables ================= */
  const TABLES = {
    jobs: {
      sub: 'Everything you have posted, in one place.',
      tabs: ['All', 'Open', 'In progress', 'In review', 'Closed'],
      action: { label: 'Post a job', icon: 'plus', modal: 'job' },
      empty: ['No closed jobs yet', 'Jobs you close or complete will be listed here with their final cost.'],
      cols: ['Job', 'Proposals', 'Budget', 'Status', 'Posted'],
      row(r, i, tab) {
        const cats = [['Design', '#8b5cf6'], ['Development', '#2dd4bf'], ['Video', '#fb923c'], ['Writing', '#22c55e'], ['Marketing', '#6d8bff']];
        const [cat, c] = pick(r, cats);
        const sts = [['Open', 'teal'], ['In progress', 'purple'], ['In review', 'orange']];
        const s = tab ? sts[tab - 1] : pick(r, sts);
        const n = int(r, 3, 40), title = D.jobs[(i + tab * 3) % D.jobs.length];
        const ppl = others();
        const duo = `<div style="display:flex;align-items:center;gap:10px"><div class="duo"><img src="${pick(r, ppl).av}" alt=""><img src="${pick(r, ppl).av}" alt=""><img src="${pick(r, ppl).av}" alt=""></div><span>${n}</span></div>`;
        const budget = usd(int(r, 3, 60) * 100);
        return { cells: [`<div class="cell-p">${sq(cat[0], c)}<span><b>${title}</b><small>${cat} / Fixed price</small></span></div>`, duo, `<span class="amt">${budget}</span>`, pill(s[0], s[1]), `${int(r, 1, 20)}d ago`], m: { head: `<div class="cell-p">${sq(cat[0], c)}<span><b>${title}</b><small>${cat}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Proposals', n], ['Budget', budget]] } };
      }
    },
    contracts: {
      sub: 'Active work, milestones and what is due next.',
      tabs: ['Active', 'Pending', 'Completed', 'Disputed'],
      action: { label: 'New contract', icon: 'file-plus', modal: 'contract' },
      empty: ['No disputes. Nice.', 'If something goes wrong on a contract, it shows up here with every message and file.'],
      cols: ['Freelancer', 'Contract', 'Progress', 'Amount', 'Status', 'Due'],
      row(r, i, tab) {
        const p = others()[(i * 3 + tab) % others().length];
        const sts = [['Active', 'green'], ['Awaiting start', 'orange'], ['Completed', 'teal']];
        const s = sts[tab] || sts[0];
        const pr = tab === 2 ? 100 : tab === 1 ? 0 : int(r, 12, 92);
        const amt = usd(int(r, 6, 80) * 100);
        const title = D.jobs[(i + 2) % D.jobs.length];
        return { cells: [person(p), `<span style="color:var(--text)">${title}</span>`, `<div class="prog"><i><em style="width:${pr}%"></em></i><span>${pr}%</span></div>`, `<span class="amt">${amt}</span>`, pill(s[0], s[1]), dateStr(r)], m: { head: person(p, title), pill: pill(s[0], s[1]), dl: [['Amount', amt], ['Progress', pr + '%']] } };
      }
    },
    bids: {
      sub: 'Every proposal you sent and where it stands.',
      tabs: ['All', 'Pending', 'Shortlisted', 'Won', 'Lost'],
      action: { label: 'Find work', icon: 'search', route: 'find-work' },
      empty: ['No lost bids', 'Bids that clients decline land here, with tips to make the next one stronger.'],
      cols: ['Job', 'Client', 'Your bid', 'Status', 'Sent'],
      row(r, i, tab) {
        const sts = [['Pending', 'orange'], ['Shortlisted', 'purple'], ['Won', 'green']];
        const s = tab ? sts[tab - 1] : pick(r, sts);
        const p = others()[(i * 2 + tab) % others().length];
        const title = D.jobs[(i * 3 + tab) % D.jobs.length];
        const bid = usd(int(r, 3, 50) * 100);
        return { cells: [`<div class="cell-p"><span><b>${title}</b><small>${int(r, 4, 38)} proposals / ${pick(r, ['Fixed', 'Hourly'])}</small></span></div>`, person(p, p.loc), `<span class="amt">${bid}</span>`, pill(s[0], s[1]), `${int(r, 1, 9)}d ago`], m: { head: `<div class="cell-p"><span><b>${title}</b><small>${p.name}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Your bid', bid], ['Client', p.name]] } };
      }
    },
    projects: {
      sub: 'Your active work, milestones and deadlines.',
      tabs: ['Active', 'Due soon', 'Completed', 'Archived'],
      action: { label: 'Start timer', icon: 'timer', toast: 'Timer started on React dashboard build' },
      empty: ['Nothing archived', 'Finished projects you archive are kept here for your records.'],
      cols: ['Project', 'Client', 'Progress', 'Next milestone', 'Due', 'Status'],
      row(r, i, tab) {
        const p = others()[(i * 5 + tab) % others().length];
        const sts = [['On track', 'green'], ['At risk', 'orange'], ['Done', 'teal']];
        const s = tab === 2 ? sts[2] : tab === 1 ? sts[1] : pick(r, sts.slice(0, 2));
        const pr = tab === 2 ? 100 : int(r, 15, 90);
        const ms = usd(int(r, 4, 30) * 100);
        const title = D.jobs[(i + 5) % D.jobs.length];
        return { cells: [`<div class="cell-p"><span><b>${title}</b><small>Milestone ${int(r, 1, 4)} of 4</small></span></div>`, person(p, p.loc), `<div class="prog"><i><em style="width:${pr}%"></em></i><span>${pr}%</span></div>`, `<span class="amt">${ms}</span>`, dateStr(r), pill(s[0], s[1])], m: { head: `<div class="cell-p"><span><b>${title}</b><small>${p.name}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Next milestone', ms], ['Progress', pr + '%']] } };
      }
    },
    offers: {
      sub: 'Brand deals waiting on you, and the ones in motion.',
      tabs: ['New', 'Negotiating', 'Accepted', 'Declined'],
      action: { label: 'Share media kit', icon: 'share-2', toast: 'Media kit link copied' },
      empty: ['No declined offers', 'Offers you turn down are kept here in case a brand comes back.'],
      cols: ['Brand', 'Campaign', 'Deliverables', 'Offer', 'Status', 'Expires'],
      row(r, i, tab) {
        const b = D.brands[(i * 2 + tab) % D.brands.length];
        const c = pick(r, Object.values(COLORS));
        const sts = [['New', 'teal'], ['Negotiating', 'purple'], ['Accepted', 'green']];
        const s = sts[tab] || sts[0];
        const del = `${int(r, 1, 3)} short videos, ${int(r, 2, 5)} photos`;
        const offer = usd(int(r, 4, 60) * 100);
        const camp = D.campaigns[(i + tab) % D.campaigns.length];
        return { cells: [`<div class="cell-p">${sq(b[0], c)}<span><b>${b}</b><small>${pick(r, ['Beauty', 'Fitness', 'Food', 'Travel', 'Tech'])}</small></span></div>`, `<span style="color:var(--text)">${camp}</span>`, del, `<span class="amt">${offer}</span>`, pill(s[0], s[1]), `in ${int(r, 1, 9)} days`], m: { head: `<div class="cell-p">${sq(b[0], c)}<span><b>${b}</b><small>${camp}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Offer', offer], ['Deliverables', del]] } };
      }
    },
    users: {
      sub: 'Everyone on GigResource, by user type.',
      tabs: ['All', 'Clients', 'Professionals', 'Influencers', 'Affiliates', 'Suspended'],
      action: { label: 'Invite user', icon: 'user-plus', modal: 'invite' },
      empty: ['No suspended users', 'Accounts you suspend are listed here with the reason and date.'],
      cols: ['User', 'Type', 'Joined', 'Verified', 'Status', 'Revenue'],
      row(r, i, tab) {
        const p = D.people[(i * 4 + tab * 3) % D.people.length];
        const types = [['Client', 'teal'], ['Professional', 'purple'], ['Influencer', 'orange'], ['Affiliate', 'green']];
        const t = tab ? types[tab - 1] : pick(r, types);
        const ver = r() > .25;
        const stt = r() > .2 ? ['Active', 'green'] : ['In review', 'orange'];
        const rev = usd(int(r, 2, 900) * 10);
        return { cells: [person(p, '@' + p.name.toLowerCase().replace(/\s/g, '')), pill(t[0], t[1]), dateStr(r) + ', 2026', ver ? `<span style="color:var(--teal);display:inline-flex;gap:6px;align-items:center">${ic('badge-check')}Yes</span>` : `<span style="color:var(--faint);display:inline-flex;gap:6px;align-items:center">${ic('clock')}Pending</span>`, pill(stt[0], stt[1]), `<span class="amt">${rev}</span>`], m: { head: person(p, t[0]), pill: pill(stt[0], stt[1]), dl: [['Revenue', rev], ['Verified', ver ? 'Yes' : 'Pending']] } };
      }
    },
    reports: {
      sub: 'Flagged content and accounts that need a look.',
      tabs: ['Flagged', 'Under review', 'Resolved', 'Dismissed'],
      action: { label: 'Export CSV', icon: 'download', toast: 'Report export started' },
      empty: ['Nothing dismissed', 'Reports you dismiss are archived here for 90 days.'],
      cols: ['Report', 'Reported by', 'Category', 'Priority', 'Status', 'Date'],
      row(r, i, tab) {
        const titles = ['Off-platform payment request', 'Spam proposals', 'Suspicious reviews', 'Copyright claim on a deliverable', 'Abusive message', 'Duplicate account', 'Misleading job post'];
        const pr = pick(r, [['High', 'red'], ['Medium', 'orange'], ['Low', 'gray']]);
        const sts = [['Flagged', 'red'], ['Under review', 'orange'], ['Resolved', 'green']];
        const s = sts[tab] || sts[0];
        const p = D.people[(i * 2 + tab) % D.people.length];
        const t = titles[(i + tab) % titles.length];
        return { cells: [`<div class="cell-p">${sq('!', pr[1] === 'red' ? '#f87171' : pr[1] === 'orange' ? '#fb923c' : '#9aa4c4')}<span><b>${t}</b><small>#R-${2040 + i * 7 + tab}</small></span></div>`, person(p, p.loc), pick(r, ['Payments', 'Messaging', 'Content', 'Accounts']), pill(pr[0], pr[1]), pill(s[0], s[1]), dateStr(r)], m: { head: `<div class="cell-p"><span><b>${t}</b><small>by ${p.name}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Priority', pr[0]], ['Report', '#R-' + (2040 + i * 7 + tab)]] } };
      }
    },
    disputes: {
      sub: 'Disagreements between clients and talent, with money on hold.',
      tabs: ['Open', 'Mediation', 'Resolved', 'Escalated'],
      action: { label: 'Assign to me', icon: 'user-check', toast: '3 disputes assigned to you' },
      empty: ['No escalated disputes', 'Disputes that need legal or finance review will show up here.'],
      cols: ['Dispute', 'Parties', 'Amount', 'Reason', 'Status', 'Age'],
      row(r, i, tab) {
        const a = D.people[(i * 3 + tab) % D.people.length], b = D.people[(i * 3 + tab + 5) % D.people.length];
        const sts = [['Open', 'orange'], ['Mediation', 'purple'], ['Resolved', 'green']];
        const s = sts[tab] || sts[0];
        const amt = usd(int(r, 3, 60) * 100);
        const reason = pick(r, ['Work not delivered', 'Quality concerns', 'Scope changed', 'Late delivery', 'Payment withheld']);
        return { cells: [`<div class="cell-p"><span><b>#D-${1080 + i * 3 + tab}</b><small>${D.jobs[(i + 4) % D.jobs.length]}</small></span></div>`, `<div style="display:flex;align-items:center;gap:10px"><div class="duo"><img src="${a.av}" alt=""><img src="${b.av}" alt=""></div><small style="color:var(--faint)">${a.name.split(' ')[0]} vs ${b.name.split(' ')[0]}</small></div>`, `<span class="amt">${amt}</span>`, reason, pill(s[0], s[1]), `${int(r, 1, 14)}d`], m: { head: `<div class="cell-p"><span><b>#D-${1080 + i * 3 + tab}</b><small>${a.name} vs ${b.name}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Amount', amt], ['Reason', reason]] } };
      }
    },
    referrals: {
      sub: 'People who joined through your links.',
      tabs: ['All', 'Signed up', 'Active', 'Paid out', 'Expired'],
      action: { label: 'Create link', icon: 'link', modal: 'link' },
      empty: ['No expired referrals', 'Referrals expire after 90 days without a first job. None so far.'],
      cols: ['Referral', 'Joined via', 'Type', 'Status', 'Earned'],
      row(r, i, tab) {
        const p = others()[(i * 2 + tab) % others().length];
        const via = pick(r, ['Spring Newsletter', 'Blog review', 'Partner page', 'Podcast promo', 'Webinar']);
        const t = pick(r, [['Client', 'teal'], ['Professional', 'purple'], ['Influencer', 'orange']]);
        const sts = [['Signed up', 'teal'], ['Active', 'green'], ['Paid out', 'purple']];
        const s = tab ? sts[tab - 1] : pick(r, sts);
        const earned = usd(int(r, 1, 40) * 10);
        return { cells: [person(p, p.loc), `<span style="display:inline-flex;gap:6px;align-items:center;color:var(--text)">${ic('link-2')}${via}</span>`, pill(t[0], t[1]), pill(s[0], s[1]), `<span class="amt">${earned}</span>`], m: { head: person(p, via), pill: pill(s[0], s[1]), dl: [['Earned', earned], ['Type', t[0]]] } };
      }
    }
  };

  function tabCounts(kind, n) {
    const r = rng(kind + st.role);
    const c = n.map((t, i) => (i === n.length - 1 ? 0 : int(r, 4, 48)));
    if (/^All/.test(n[0])) c[0] = c.slice(1).reduce((a, b) => a + b, 0);
    return n.map((t, i) => [t, c[i]]);
  }

  function tableBody(kind, rows = 8, seedExtra = '') {
    const T = TABLES[kind];
    const r = rng(kind + st.tab + seedExtra);
    const data = Array.from({ length: rows }, (_, i) => T.row(r, i, st.tab));
    const desk = `<table class="tbl"><thead><tr><th style="width:44px"><span class="chk" data-chk-all></span></th>${T.cols.map(c => `<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>${data.map(d => `<tr><td><span class="chk" data-chk></span></td>${d.cells.map(c => `<td>${c}</td>`).join('')}<td><button class="row-act" data-toast="More actions open here" aria-label="More">${ic('more-horizontal')}</button></td></tr>`).join('')}</tbody></table>`;
    const mob = data.map(d => `<div class="mcard-row"><div class="top-r">${d.m.head}${d.m.pill}</div><dl>${d.m.dl.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>`).join('');
    return `<div class="tbl-desk">${desk}</div><div class="mcards">${mob}</div>`;
  }

  function mountTable() {
    page.addEventListener('click', onChk);
    cleanups.push(() => page.removeEventListener('click', onChk));
    const q = $('[data-filter]', page);
    if (q) q.addEventListener('input', () => {
      const v = q.value.toLowerCase();
      $$('.tbl tbody tr, .mcard-row, .gcards > .gc', page).forEach(tr => { tr.style.display = tr.textContent.toLowerCase().includes(v) ? '' : 'none'; });
    });
  }
  function onChk(e) {
    const c = e.target.closest('[data-chk]');
    const all = e.target.closest('[data-chk-all]');
    if (c) c.closest('tr').classList.toggle('sel');
    if (all) {
      const rows = $$('.tbl tbody tr', page);
      const on = !rows.every(r => r.classList.contains('sel'));
      rows.forEach(r => r.classList.toggle('sel', on));
      all.closest('tr').classList.toggle('sel', on);
    }
  }

  function toolbar(placeholder) {
    return `<div class="toolbar anim"><label class="field">${ic('search')}<input class="input" data-filter placeholder="${placeholder}"></label><button class="fchip on">${ic('sliders-horizontal')}All dates</button><button class="fchip hide-m">${ic('plus')}Status</button><button class="fchip hide-m">${ic('plus')}Budget</button><div class="right"><select class="input" aria-label="Sort"><option>Newest first</option><option>Oldest first</option><option>Highest amount</option></select><button class="btn btn-g btn-sm" data-toast="CSV export started">${ic('download')}Export</button></div></div>`;
  }

  /* ================= card grids ================= */
  const CARDS = {
    proposals: {
      sub: 'Freelancers who applied to your jobs. Shortlist the best ones.',
      tabs: ['All', 'Shortlisted', 'Interviewing', 'Archived'],
      action: { label: 'Post a job', icon: 'plus', modal: 'job' },
      empty: ['No archived proposals', 'Proposals you archive stay here so you can come back to them.'],
      card(r, i) {
        const p = others()[(i + st.tab * 2) % others().length];
        const letters = ['I have shipped three marketplace dashboards this year and can start on Monday. Here is how I would approach your sidebar and tables.', 'Your brief is clear. I would keep your current colors and tighten spacing, states and the mobile layout first.', 'Happy to do a quick paid test task so you can see my process before committing to the full job.', 'I specialize in design systems for SaaS. I can turn your current pages into one consistent kit your devs will love.'];
        const rate = int(r, 25, 95);
        return `<article class="card gc anim"><div class="gc-b"><div class="gc-person"><img src="${p.av}" alt="" loading="lazy"><div><b>${p.name}</b><small>${p.title} / ${p.loc}</small></div></div><div class="gc-meta"><span class="stars">${ic('star')}${(4.6 + r() * .4).toFixed(1)}</span><span>${int(r, 12, 180)} reviews</span><span>${ic('badge-check')}${int(r, 88, 100)}% job success</span></div><p>${pick(r, letters)}</p><div class="tags">${[0, 1, 2].map(k => `<span>${D.skills[(i * 3 + k) % D.skills.length]}</span>`).join('')}</div><div class="gc-f"><span class="amt">$${rate}/hr</span><button class="btn btn-g btn-sm" data-go="messages">Message</button><button class="btn btn-p btn-sm" data-toast="${p.name.split(' ')[0]} added to your shortlist">Shortlist</button></div></div></article>`;
      }
    },
    work: {
      sub: 'Jobs picked for your skills and rate.',
      tabs: ['Best matches', 'Most recent', 'Applied', 'Saved'],
      action: { label: 'Job alerts', icon: 'bell-plus', toast: 'Job alerts turned on' },
      empty: ['No saved jobs', 'Tap the bookmark on any job to keep it here for later.'],
      card(r, i) {
        const b = D.brands[(i + st.tab * 3) % D.brands.length];
        const job = D.jobs[(i * 2 + st.tab) % D.jobs.length];
        const descs = ['We need a clean, modern refresh of our existing pages. Keep the brand, fix spacing and states, and make it work great on mobile.', 'Looking for someone who can move fast, communicate clearly and deliver in milestones. Long term work for the right person.', 'Small, well defined task with room to grow. Please share two similar projects in your proposal.'];
        const budget = usd(int(r, 5, 80) * 100);
        return `<article class="card gc anim"><div class="gc-b"><div class="gc-meta"><span style="color:var(--text);font-weight:600">${b}</span><span>${ic('badge-check', 'verified')}Payment verified</span><span>${int(r, 1, 23)}h ago</span><button class="row-act" style="margin-left:auto" data-toast="Saved for later" aria-label="Save">${ic('bookmark')}</button></div><h4>${job}</h4><p>${pick(r, descs)}</p><div class="tags">${[0, 1, 2].map(k => `<span>${D.skills[(i * 2 + k + 3) % D.skills.length]}</span>`).join('')}</div><div class="gc-meta"><span>${ic('users')}${int(r, 2, 30)} proposals</span><span>${ic('map-pin')}${pick(r, ['Worldwide', 'US only', 'Europe'])}</span><span>${ic('clock')}${pick(r, ['Fixed', 'Hourly'])}</span></div><div class="gc-f"><span class="amt">${budget}</span><button class="btn btn-p btn-sm" data-modal="bid">Bid now</button></div></div></article>`;
      }
    },
    campaigns: {
      sub: 'Brand campaigns you are part of, and what is due.',
      tabs: ['Live', 'Upcoming', 'Completed', 'Drafts'],
      action: { label: 'New content', icon: 'upload', modal: 'content' },
      empty: ['No drafts', 'Start a campaign draft and it is saved here automatically.'],
      card(r, i) {
        const b = D.brands[(i + 2 + st.tab) % D.brands.length];
        const c = D.campaigns[(i + st.tab * 2) % D.campaigns.length];
        const isV = i % 2 === 0;
        const m = isV ? D.media.video[(i / 2 + st.tab) % D.media.video.length] : D.media.img[(i + st.tab) % D.media.img.length];
        const media = isV ? `<video muted loop playsinline preload="none" poster="assets/video/${m}.jpg" data-src="assets/video/${m}.mp4"></video><span class="play">${ic('play')}</span>` : `<img src="assets/img/${m}.jpg" alt="" loading="lazy">`;
        const total = int(r, 3, 6), done = st.tab === 2 ? total : int(r, 1, total);
        const s = [['Live', 'green'], ['Starts soon', 'teal'], ['Completed', 'purple']][st.tab] || ['Live', 'green'];
        return `<article class="card gc anim"><div class="gc-media">${media}${pill(s[0], s[1])}</div><div class="gc-b"><div class="gc-meta"><span style="color:var(--text);font-weight:600">${b}</span><span>${ic('calendar')}Due ${dateStr(r)}</span></div><h4>${c}</h4><div class="prog"><i><em style="width:${Math.round(done / total * 100)}%"></em></i><span>${done}/${total}</span></div><div class="gc-meta"><span>${ic('eye')}${(r() * 400 + 40).toFixed(0)}k reach</span><span>${ic('heart')}${(r() * 6 + 3).toFixed(1)}%</span></div><div class="gc-f"><span class="amt">${usd(int(r, 8, 60) * 100)}</span><button class="btn btn-g btn-sm" data-toast="Campaign brief opened">View brief</button></div></div></article>`;
      }
    },
    content: {
      sub: 'Everything you created, scheduled or posted.',
      tabs: ['All', 'Videos', 'Photos', 'Scheduled', 'Drafts'],
      action: { label: 'Upload', icon: 'upload', modal: 'content' },
      empty: ['No drafts', 'Unfinished uploads are saved here so nothing gets lost.'],
      card(r, i) {
        const isV = st.tab === 1 || (st.tab !== 2 && i % 3 === 0);
        const m = isV ? D.media.video[(i + 3) % D.media.video.length] : D.media.img[(i * 2 + st.tab) % D.media.img.length];
        const media = isV ? `<video muted loop playsinline preload="none" poster="assets/video/${m}.jpg" data-src="assets/video/${m}.mp4"></video><span class="play">${ic('play')}</span>` : `<img src="assets/img/${m}.jpg" alt="" loading="lazy">`;
        const titles = ['Morning desk routine', 'What is in my camera bag', 'Five tools I use daily', 'City ride at sunrise', 'Unboxing the new kit', 'Behind the shot', 'Weekend reset', 'Coffee and edits', 'Studio tour'];
        const s = st.tab === 3 ? ['Scheduled', 'teal'] : ['Published', 'green'];
        return `<article class="card gc anim"><div class="gc-media">${media}${pill(s[0], s[1])}</div><div class="gc-b"><h4>${titles[(i + st.tab) % titles.length]}</h4><div class="mini-stats"><div><b>${(r() * 90 + 5).toFixed(1)}k</b>Views</div><div><b>${(r() * 9 + 1).toFixed(1)}k</b>Likes</div><div><b>${int(r, 80, 900)}</b>Saves</div></div><div class="gc-f"><span style="font-size:12.5px;color:var(--faint)">${dateStr(r)}</span><button class="btn btn-g btn-sm" data-toast="Editor opened">Edit</button></div></div></article>`;
      }
    },
    links: {
      sub: 'Your tracked links and how each one performs.',
      tabs: ['Active', 'Paused', 'Archived'],
      action: { label: 'Create link', icon: 'link', modal: 'link' },
      empty: ['No archived links', 'Links you archive stop tracking but keep their history here.'],
      card(r, i) {
        const names = ['Spring Newsletter', 'Blog review', 'Partner page', 'Podcast promo', 'Webinar', 'Resource guide'];
        const n = names[(i + st.tab) % names.length];
        const slug = n.toLowerCase().replace(/\s/g, '-');
        const clicks = int(r, 300, 5200), sign = Math.round(clicks * (.02 + r() * .05));
        const s = st.tab === 1 ? ['Paused', 'gray'] : ['Active', 'green'];
        return `<article class="card gc anim"><div class="gc-b"><div class="gc-meta"><span style="color:var(--text);font:600 15.5px var(--display)">${n}</span><span style="margin-left:auto">${pill(s[0], s[1])}</span></div><div class="linkbox"><span>gigresource.com/r/grace-${slug}</span><button class="btn btn-g btn-sm" data-toast="Link copied">${ic('copy')}Copy</button></div><div class="mini-stats"><div><b>${clicks.toLocaleString()}</b>Clicks</div><div><b>${sign}</b>Sign-ups</div><div><b>${(sign / clicks * 100).toFixed(1)}%</b>Conv.</div></div>${spark(rng(slug), COLORS.green, 'l' + i)}<div class="gc-f"><span class="amt">${usd(sign * 9)}</span><span style="font-size:12px;color:var(--faint)">earned</span><button class="btn btn-g btn-sm" data-toast="Share sheet opened">${ic('share-2')}Share</button></div></div></article>`;
      }
    }
  };

  function mountMediaVideos() {
    const vids = $$('.gc-media video, .welcome video', page);
    if (!vids.length) return;
    const io = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }), { threshold: .25 });
    vids.forEach(v => io.observe(v));
    cleanups.push(() => { io.disconnect(); vids.forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); }); });
  }

  /* ================= sparkline ================= */
  function spark(r, color, id) {
    const n = 14, w = 200, h = 44;
    let v = 20 + r() * 10;
    const pts = Array.from({ length: n }, () => (v = Math.max(4, Math.min(40, v + (r() - .38) * 9))));
    const x = i => i / (n - 1) * w, y = p => h - p;
    let d = `M0 ${y(pts[0])}`;
    for (let i = 1; i < n; i++) {
      const cx = (x(i - 1) + x(i)) / 2;
      d += ` C${cx} ${y(pts[i - 1])}, ${cx} ${y(pts[i])}, ${x(i)} ${y(pts[i])}`;
    }
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="sg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#sg${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  }

  /* ================= templates ================= */
  const TPL = {};

  TPL.dashboard = (it, R) => {
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    const first = R.user.name.split(' ')[0];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const C = 188.5;
    const rings = R.welcome.ring.map(g => `<div class="ring"><svg viewBox="0 0 70 70"><circle class="bg" cx="35" cy="35" r="30"/><circle class="fg" cx="35" cy="35" r="30" stroke="${g.c}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C * (1 - g.v / 100)}"/></svg><b>${g.v}%</b><small>${g.l}</small></div>`).join('');
    const kpis = R.kpis.map((k, i) => {
      const good = k.d.startsWith('+') || (k.good && k.d.startsWith('-'));
      return `<div class="card kpi c-${k.c} anim"><div class="kpi-top"><span class="kpi-ico">${ic(k.icon)}</span><span>${k.label}</span></div><div class="kpi-val"><b data-to="${k.v}" data-pre="${k.pre || ''}" data-suf="${k.suf || ''}" data-dec="${k.dec || 0}">${k.pre || ''}0${k.suf || ''}</b><span class="delta ${good ? 'up' : 'down'}">${ic(k.d.startsWith('-') ? 'trending-down' : 'trending-up')}${k.d}</span></div>${spark(rng(st.role + k.label), COLORS[k.c], 'k' + i)}</div>`;
    }).join('');
    const side = R.globe
      ? `<div class="card globe-card anim"><div class="card-h"><div><h3>Live activity</h3><p>Jobs, payments and sign-ups right now</p></div>${pill('Live', 'green')}</div><div class="globe-box" id="globe"></div><div class="globe-stats"><div><b>1,284</b>Online now</div><div><b>312</b>Jobs today</div><div><b>$94k</b>Paid today</div></div></div>`
      : `<div class="card anim"><div class="card-h"><div><h3>${R.donut.title}</h3><p>Last 30 days</p></div><button class="row-act" data-toast="Chart options" aria-label="Options">${ic('more-horizontal')}</button></div><div class="card-b"><div class="donut-box"><canvas id="donut"></canvas><div class="donut-center"><div><b>${R.donut.data[0]}%</b><small>${R.donut.labels[0]}</small></div></div></div><div class="legend">${R.donut.labels.map((l, i) => `<div><i style="background:${[COLORS.teal, COLORS.purple, COLORS.orange, COLORS.navy][i]}"></i>${l}<b>${R.donut.data[i]}%</b></div>`).join('')}</div></div></div>`;
    const feedR = rng('feed' + st.role);
    const acts = ['sent you a proposal', 'submitted a milestone', 'left a 5 star review', 'accepted your offer', 'sent a message', 'joined from your link', 'requested a change'];
    const feed = others().slice(0, 6).map((p, i) => `<div class="feed-i"><img src="${p.av}" alt="" loading="lazy"><div><p><b>${p.name}</b> ${acts[(i + st.role.length) % acts.length]}</p><small>${int(feedR, 2, 59)} min ago</small></div></div>`).join('');
    const head = header({ label: `${greet}, ${first}` }, today, `<button class="btn btn-g" data-toast="Widgets can be rearranged here">${ic('layout-grid')}Customize</button>${actionBtn(R.primary)}`);
    const body = `
      <section class="welcome anim">
        <video muted loop playsinline autoplay preload="auto" poster="assets/video/${R.video}.jpg" data-src="assets/video/${R.video}.mp4"></video>
        <div class="welcome-in"><span class="kick"><i></i>${R.welcome.kick}</span><h2>Here is what moved since yesterday.</h2><p>${R.welcome.text}</p><div class="row"><button class="btn btn-p" data-primary>${ic(R.primary.icon)}${R.welcome.cta[0]}</button><button class="btn btn-g" data-go="${R.welcome.go}">${R.welcome.cta[1]}${ic('arrow-right')}</button></div></div>
        <div class="welcome-side">${rings}</div>
      </section>
      <div class="grid g-kpi">${kpis}</div>
      <div class="grid g-2-1 mt">
        <div class="card anim"><div class="card-h"><div><h3>${R.chart.title}</h3><p>${R.chart.sub}</p></div><div class="seg" id="range"><button data-r="7">7D</button><button class="on" data-r="30">30D</button><button data-r="90">90D</button></div></div><div class="card-b"><div class="chart-box"><canvas id="line"></canvas></div></div></div>
        ${side}
      </div>
      <div class="grid g-2-1 mt">
        <div class="card tbl-wrap anim"><div class="card-h" style="padding-bottom:14px"><div><h3>${R.recent.title}</h3><p>Latest 5</p></div><a class="link" href="#/${st.role}/${(R.nav.flatMap(g => g.items).find(x => x.kind === R.recent.kind) || R.nav[0].items[1]).id}">View all${ic('arrow-right')}</a></div>${tableBody(R.recent.kind, 5, 'dash')}</div>
        <div class="card anim"><div class="card-h"><div><h3>Activity</h3><p>Across your account</p></div><a class="link" href="#" data-toast="Full activity log opens here">All${ic('arrow-right')}</a></div><div class="card-b"><div class="feed">${feed}</div></div></div>
      </div>`;
    return {
      head, body, mount() {
        mountMediaVideos();
        // rings
        requestAnimationFrame(() => $$('.ring .fg', page).forEach(c => { c.style.strokeDashoffset = c.dataset.off; }));
        // charts
        lineChart(30);
        $('#range').addEventListener('click', e => {
          const b = e.target.closest('button');
          if (!b) return;
          $$('#range button').forEach(x => x.classList.toggle('on', x === b));
          lineChart(+b.dataset.r);
        });
        if (R.globe) { if (!EMBED) mountGlobe($('#globe')); }
        else donutChart(R.donut);
        mountTable();
      }
    };
  };

  TPL.table = (it, R) => {
    const T = TABLES[it.kind];
    const head = header(it, T.sub, `<button class="btn btn-g" data-toast="Filters saved">${ic('bookmark')}Save view</button>${actionBtn(T.action)}`) + tabs(tabCounts(it.kind, T.tabs));
    const last = st.tab === T.tabs.length - 1;
    const body = last
      ? emptyState(T.empty[0], T.empty[1], actionBtn(T.action))
      : `${toolbar('Search ' + it.label.toLowerCase())}<div class="card tbl-wrap anim">${tableBody(it.kind)}<div class="pager"><span class="info">Showing 1 to 8 of ${tabCounts(it.kind, T.tabs)[st.tab][1]}</span><div class="pp"><button aria-label="Previous">${ic('chevron-left')}</button><button class="on">1</button><button>2</button><button>3</button><button aria-label="Next">${ic('chevron-right')}</button></div></div></div>`;
    return { head, body, mount: last ? null : mountTable };
  };

  TPL.cards = (it, R) => {
    const K = CARDS[it.kind];
    const head = header(it, K.sub, actionBtn(K.action)) + tabs(tabCounts(it.kind, K.tabs));
    const last = st.tab === K.tabs.length - 1;
    const r = rng(it.kind + st.tab);
    const n = it.kind === 'links' ? 6 : 9;
    const body = last
      ? emptyState(K.empty[0], K.empty[1], actionBtn(K.action))
      : `${toolbar('Search ' + it.label.toLowerCase())}<div class="gcards">${Array.from({ length: n }, (_, i) => K.card(r, i)).join('')}</div>`;
    return { head, body, mount: last ? null : () => { mountMediaVideos(); mountTable(); } };
  };

  TPL.messages = (it, R) => {
    const ppl = others().slice(0, 9);
    const r = rng('msg' + st.role);
    const lines = ['Sounds good, I will send the files tonight.', 'Can we move the call to Thursday?', 'Milestone 2 is ready for review.', 'Thanks! Payment received.', 'Here is the updated sidebar with all states.', 'Love the new mobile layout.', 'Quick question about the tabs.', 'Invoice attached.', 'See you on the next round.'];
    const head = header(it, 'All your conversations, in one place.', `<button class="btn btn-p" data-toast="New message window opens here">${ic('pen-square')}New message</button>`);
    const convs = ppl.map((p, i) => `<div class="conv${i === 0 ? ' on' : ''}" data-conv="${i}"><span class="av"><img src="${p.av}" alt="" loading="lazy">${i % 3 === 0 ? '<i></i>' : ''}</span><span><b>${p.name}<small>${i === 0 ? 'now' : int(r, 1, 59) + (i < 4 ? 'm' : 'h')}</small></b><em>${lines[i]}</em></span>${i < 2 ? `<span class="unread">${i + 1}</span>` : ''}</div>`).join('');
    const p = ppl[0];
    const body = `<div class="card msg anim" id="msg">
      <div class="msg-list"><label class="field">${ic('search')}<input class="input" placeholder="Search messages"></label><div class="convs">${convs}</div></div>
      <div class="thread">
        <div class="thread-h"><button class="icon-btn back" id="msgBack" aria-label="Back">${ic('arrow-left')}</button><img id="thAv" src="${p.av}" alt=""><div><b id="thName">${p.name}</b><small>Online</small></div><div class="acts"><button class="icon-btn" data-toast="Files and links" aria-label="Files">${ic('paperclip')}</button><button class="icon-btn" data-toast="Conversation details" aria-label="Info">${ic('info')}</button></div></div>
        <div class="bubbles" id="bubbles">
          <span class="day">Today</span>
          <div class="bub in">Hi! I went through the brief. Should I keep your current color scheme exactly as it is?<small>9:12 AM</small></div>
          <div class="bub out">Yes, keep the colors and the menu. We just want it polished and consistent.<small>9:14 AM</small></div>
          <div class="bub in">Perfect. Starting with the sidebar: active, hover, collapsed on laptop and the mobile drawer.<small>9:15 AM</small></div>
          <div class="bub in file">${ic('file-text')}<div><b style="font-size:13px">sidebar-states-v2.fig</b><small>2.4 MB</small></div></div>
          <div class="bub out">This looks great. Can you also show the empty and loading states?<small>9:31 AM</small></div>
          <div class="typing"><i></i><i></i><i></i></div>
        </div>
        <form class="composer" id="composer"><button type="button" class="icon-btn" aria-label="Attach">${ic('plus')}</button><input class="input" id="msgInput" placeholder="Write a message" autocomplete="off"><button class="btn btn-p" type="submit">${ic('send')}<span>Send</span></button></form>
      </div>
      <aside class="msg-side"><div class="who"><img src="${p.av}" alt=""><b>${p.name}</b><small>${p.title}</small></div><h5>Project</h5><div class="kv"><span>Job</span><b>Landing page</b></div><div class="kv"><span>Budget</span><b>$2,400</b></div><div class="kv"><span>Started</span><b>Oct 12</b></div><div class="kv"><span>Local time</span><b>4:20 PM</b></div><h5>Shared files</h5><div class="kv"><span>${ic('file-text')}</span><b>sidebar-states-v2.fig</b></div><div class="kv"><span>${ic('image')}</span><b>mobile-drawer.png</b></div></aside>
    </div>`;
    return {
      head, body, mount() {
        const msg = $('#msg'), bub = $('#bubbles');
        bub.scrollTop = bub.scrollHeight;
        $$('.conv', msg).forEach(c => c.addEventListener('click', () => {
          $$('.conv', msg).forEach(x => x.classList.toggle('on', x === c));
          const pp = ppl[+c.dataset.conv];
          $('#thAv').src = pp.av; $('#thName').textContent = pp.name;
          const u = $('.unread', c); if (u) u.remove();
          msg.classList.add('show-thread');
        }));
        $('#msgBack').addEventListener('click', () => msg.classList.remove('show-thread'));
        $('#composer').addEventListener('submit', e => {
          e.preventDefault();
          const inp = $('#msgInput'), v = inp.value.trim();
          if (!v) return;
          const typing = $('.typing', bub);
          const el = document.createElement('div');
          el.className = 'bub out';
          el.innerHTML = `${v.replace(/</g, '&lt;')}<small>now</small>`;
          bub.insertBefore(el, typing);
          inp.value = '';
          bub.scrollTop = bub.scrollHeight;
          gsap.from(el, { y: 10, opacity: 0, duration: .35 });
          const t = setTimeout(() => {
            const rep = document.createElement('div');
            rep.className = 'bub in';
            rep.innerHTML = 'Got it, I will add those states and send an update today.<small>now</small>';
            bub.insertBefore(rep, typing);
            bub.scrollTop = bub.scrollHeight;
            gsap.from(rep, { y: 10, opacity: 0, duration: .35 });
          }, 1400);
          cleanups.push(() => clearTimeout(t));
        });
      }
    };
  };

  TPL.money = (it, R) => {
    const M = R.money;
    const T = ['Overview', 'Transactions', 'Methods', 'Statements'];
    const head = header(it, 'Balances, payouts and every transaction.', `<button class="btn btn-g" data-toast="Statement downloaded">${ic('download')}Statement</button><button class="btn btn-p" data-modal="withdraw">${ic('arrow-up-right')}${st.role === 'client' ? 'Add funds' : st.role === 'admin' ? 'Run payouts' : 'Withdraw'}</button>`) + tabs(T);
    const r = rng('money' + st.role + st.tab);
    const tx = (n) => {
      const types = st.role === 'client' ? [['Payment', 'purple'], ['Deposit', 'teal'], ['Refund', 'orange']] : [['Payment', 'green'], ['Withdrawal', 'purple'], ['Fee', 'gray']];
      const rows = Array.from({ length: n }, (_, i) => {
        const p = others()[(i * 2 + 1) % others().length];
        const t = pick(r, types);
        const neg = (st.role === 'client' && t[0] === 'Payment') || t[0] === 'Withdrawal' || t[0] === 'Fee';
        const amt = int(r, 2, 40) * 50;
        const s = r() > .2 ? ['Completed', 'green'] : ['Pending', 'orange'];
        return { cells: [dateStr(r), `<div class="cell-p"><span><b>${t[0] === 'Fee' ? 'Service fee' : 'Milestone ' + int(r, 1, 4) + ' - ' + D.jobs[i % D.jobs.length]}</b><small>#TX-${48210 + i * 13}</small></span></div>`, person(p, p.loc), pill(t[0], t[1]), `<span class="amt" style="color:${neg ? 'var(--text)' : 'var(--green)'}">${neg ? '-' : '+'}${usd(amt)}</span>`, pill(s[0], s[1])], m: { head: `<div class="cell-p"><span><b>${t[0]}</b><small>${p.name}</small></span></div>`, pill: pill(s[0], s[1]), dl: [['Amount', (neg ? '-' : '+') + usd(amt)], ['Date', dateStr(r)]] } };
      });
      const cols = ['Date', 'Description', 'With', 'Type', 'Amount', 'Status'];
      return `<div class="tbl-desk"><table class="tbl"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(d => `<tr>${d.cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="mcards">${rows.map(d => `<div class="mcard-row"><div class="top-r">${d.m.head}${d.m.pill}</div><dl>${d.m.dl.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>`).join('')}</div>`;
    };
    let body;
    if (st.tab === 0) {
      const mths = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const vals = mths.map(() => 30 + r() * 70);
      body = `<div class="grid g-bal">
        <div class="bal anim" id="bal"><span class="chip-ic"></span><small>${M.bal}</small><b class="big" data-to="${M.amount}" data-pre="$" data-dec="0">$0</b><div class="row"><div><small>${M.out}</small><b>${usd(M.outAmt)}</b></div><div style="text-align:right"><small>Next payout</small><b>Fri, Nov 7</b></div></div></div>
        <div class="card anim"><div class="card-h"><div><h3>Last 6 months</h3><p>${M.title} by month</p></div>${pill('+18% vs last period', 'green')}</div><div class="card-b"><div class="bars" id="bars">${mths.map((m, i) => `<div class="${i === 5 ? 'hi' : ''}"><i style="height:${vals[i]}%"></i><span>${m}</span></div>`).join('')}</div></div></div>
      </div>
      <div class="grid g-3 mt">
        <div class="card kpi c-teal anim"><div class="kpi-top"><span class="kpi-ico">${ic('arrow-down-left')}</span><span>Money in</span></div><div class="kpi-val"><b data-to="${M.outAmt * 1.4}" data-pre="$">$0</b></div></div>
        <div class="card kpi c-purple anim"><div class="kpi-top"><span class="kpi-ico">${ic('arrow-up-right')}</span><span>Money out</span></div><div class="kpi-val"><b data-to="${M.outAmt * .6}" data-pre="$">$0</b></div></div>
        <div class="card kpi c-orange anim"><div class="kpi-top"><span class="kpi-ico">${ic('receipt')}</span><span>Fees saved</span></div><div class="kpi-val"><b data-to="${Math.round(M.outAmt * .03)}" data-pre="$">$0</b></div></div>
      </div>
      <div class="card tbl-wrap mt anim"><div class="card-h" style="padding-bottom:14px"><div><h3>Recent transactions</h3><p>Last 5</p></div><a class="link" href="#/${st.role}/${st.page}/1">View all${ic('arrow-right')}</a></div>${tx(5)}</div>`;
    } else if (st.tab === 1) {
      body = `${toolbar('Search transactions')}<div class="card tbl-wrap anim">${tx(10)}<div class="pager"><span class="info">Showing 1 to 10 of 248</span><div class="pp"><button class="on">1</button><button>2</button><button>3</button></div></div></div>`;
    } else if (st.tab === 2) {
      body = `<div class="grid g-1-1"><div class="card anim"><div class="card-h"><div><h3>${st.role === 'client' ? 'Payment methods' : 'Payout methods'}</h3><p>Where money moves</p></div><button class="btn btn-g btn-sm" data-modal="withdraw">${ic('plus')}Add</button></div><div class="card-b">
        <div class="method"><span class="m-ic" style="background:#1a2a6c;color:#fff">BANK</span><span><b>Bank account ending 4821</b><small>Chase / US / 1 to 2 days</small></span>${pill('Default', 'teal')}</div>
        <div class="method"><span class="m-ic" style="background:linear-gradient(135deg,#8b5cf6,#2dd4bf);color:#fff">CARD</span><span><b>Card ending 4242</b><small>Expires 08/28</small></span>${pill('Backup', 'gray')}</div>
        <div class="method"><span class="m-ic" style="background:#22c55e22;color:var(--green)">WIRE</span><span><b>International wire</b><small>SWIFT / 3 to 5 days</small></span>${pill('Verified', 'green')}</div>
      </div></div><div class="card anim"><div class="card-h"><div><h3>Schedule</h3><p>When payouts happen</p></div></div><div class="card-b">
        <div class="tog"><span><b>Weekly payouts</b><small>Every Friday, if balance is over $100</small></span><button class="sw on" data-sw aria-label="Weekly payouts"></button></div>
        <div class="tog"><span><b>Instant payouts</b><small>1% fee, arrives in minutes</small></span><button class="sw" data-sw aria-label="Instant payouts"></button></div>
        <div class="tog"><span><b>Email receipts</b><small>Send a receipt for every payment</small></span><button class="sw on" data-sw aria-label="Email receipts"></button></div>
      </div></div></div>`;
    } else {
      body = `<div class="card anim">${['October', 'September', 'August', 'July', 'June', 'May'].map((m, i) => `<div class="stmt"><span class="ic">${ic('file-text')}</span><span><b>${m} 2026 statement</b><small>PDF / ${int(r, 120, 480)} KB</small></span><button class="btn btn-g btn-sm" data-toast="${m} statement downloaded">${ic('download')}Download</button></div>`).join('')}</div>`;
    }
    return {
      head, body, mount() {
        const bal = $('#bal');
        if (bal) {
          bal.addEventListener('mousemove', e => {
            const b = bal.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
            bal.style.setProperty('--mx', px * 100 + '%'); bal.style.setProperty('--my', py * 100 + '%');
            gsap.to(bal, { rotateY: (px - .5) * 14, rotateX: (.5 - py) * 14, transformPerspective: 900, duration: .5, ease: 'power3' });
          });
          bal.addEventListener('mouseleave', () => gsap.to(bal, { rotateX: 0, rotateY: 0, duration: .8, ease: 'expo.out' }));
        }
        if ($('#bars')) gsap.from('#bars i', { scaleY: 0, duration: 1, ease: 'expo.out', stagger: .06, delay: .2 });
        mountTable();
      }
    };
  };

  TPL.settings = (it, R) => {
    const T = [['Profile', 'user-round'], ['Security', 'shield-check'], ['Notifications', 'bell'], ['Billing', 'credit-card']];
    const u = R.user;
    const head = header(it, 'Manage your account, privacy and alerts.', '');
    const navH = `<nav class="set-nav anim">${T.map(([l, i], k) => `<button class="${k === st.tab ? 'on' : ''}" data-tab="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
    const foot = `<div class="form-foot"><button class="btn btn-g" data-toast="Changes discarded">Cancel</button><button class="btn btn-p" data-toast="Saved">${ic('check')}Save changes</button></div>`;
    let content;
    if (st.tab === 0) {
      const extra = st.role === 'client' ? ['Company', 'Brightpath'] : st.role === 'admin' ? ['Team', 'Trust and Safety'] : ['Hourly rate', st.role === 'influencer' ? '$350 per post' : '$65 / hr'];
      content = `<div class="card anim"><div class="card-h"><div><h3>Public profile</h3><p>This is what others see</p></div></div><div class="card-b form">
        <div class="av-up"><img src="${u.av}" alt=""><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-g btn-sm" data-toast="Photo picker opens here">${ic('upload')}Upload new</button><button class="btn btn-g btn-sm" data-toast="Photo removed">Remove</button></div></div>
        <div class="frow"><div class="fl"><label>Full name</label><input class="input" value="${u.name}"></div><div class="fl"><label>Title</label><input class="input" value="${u.title}"></div></div>
        <div class="frow"><div class="fl"><label>Location</label><input class="input" value="${u.loc}"></div><div class="fl"><label>${extra[0]}</label><input class="input" value="${extra[1]}"></div></div>
        <div class="fl"><label>Bio</label><textarea class="input">I care about clear communication, clean work and shipping on time. Based in ${u.loc.split(',')[0]}, working with teams worldwide.</textarea><span class="hint">Keep it short. 300 characters max.</span></div>
        <div class="fl"><label>Skills</label><div class="tags">${D.skills.slice(0, 6).map(s => `<span>${s}</span>`).join('')}<span style="border-style:dashed">+ Add</span></div></div>
        ${foot}</div></div>`;
    } else if (st.tab === 1) {
      content = `<div class="card anim"><div class="card-h"><div><h3>Sign in and security</h3><p>Keep your account safe</p></div>${pill('Strong', 'green')}</div><div class="card-b form">
        <div class="frow"><div class="fl"><label>Current password</label><input class="input" type="password" value="password123"></div><div class="fl"><label>New password</label><input class="input" type="password" placeholder="At least 12 characters"></div></div>
        <div class="tog"><span><b>Two-step verification</b><small>Ask for a code when signing in on a new device</small></span><button class="sw on" data-sw aria-label="Two-step verification"></button></div>
        <div class="tog"><span><b>Login alerts</b><small>Email me when someone signs in</small></span><button class="sw on" data-sw aria-label="Login alerts"></button></div>
        <div><h3 style="font:600 15px var(--display);margin:6px 0 4px">Active sessions</h3>
          <div class="session"><span class="ic">${ic('laptop')}</span><span><b>Chrome on Windows</b><small>This device / Austin, US</small></span>${pill('Current', 'teal')}</div>
          <div class="session"><span class="ic">${ic('smartphone')}</span><span><b>Mobile app on iPhone</b><small>2 hours ago / Austin, US</small></span><button class="btn btn-g btn-sm" data-toast="Session signed out">Sign out</button></div>
        </div>${foot}</div></div>`;
    } else if (st.tab === 2) {
      const rows = [['New messages', 'When someone writes to you', true], ['Proposals and offers', 'New proposals, offers and replies', true], ['Payments', 'Money in, money out and receipts', true], ['Milestones', 'Due dates and reviews', true], ['Product news', 'New features, once a month', false], ['Tips', 'Short guides to get more from GigResource', false]];
      content = `<div class="card anim"><div class="card-h"><div><h3>Notifications</h3><p>Choose what reaches you</p></div></div><div class="card-b">${rows.map(([b, s, on]) => `<div class="tog"><span><b>${b}</b><small>${s}</small></span><button class="sw${on ? ' on' : ''}" data-sw aria-label="${b}"></button></div>`).join('')}</div></div>`;
    } else {
      content = `<div class="card anim"><div class="card-h"><div><h3>Plan</h3><p>Your current plan and usage</p></div>${pill('Pro', 'purple')}</div><div class="card-b form">
        <div class="method"><span class="m-ic" style="background:linear-gradient(135deg,#2dd4bf,#8b5cf6);color:#051018">PRO</span><span><b>GigResource Pro</b><small>$29 / month / renews Nov 21</small></span><button class="btn btn-g btn-sm" data-toast="Plan options open here">Change</button></div>
        <div class="method"><span class="m-ic" style="background:#1a2a6c;color:#fff">CARD</span><span><b>Card ending 4242</b><small>Billing card</small></span><button class="btn btn-g btn-sm" data-toast="Card form opens here">Update</button></div>
        <div class="callout">${ic('info')}<div>Invoices are emailed on the 21st of every month and stay available under Payments.</div></div>
      </div></div>`;
    }
    return { head, body: `<div class="set">${navH}<div>${content}</div></div>`, mount: null };
  };

  TPL.explainer = (it, R) => {
    const T = ['Video tour', 'Guides', 'FAQ'];
    const head = header(it, 'Short videos and guides to get the most out of GigResource.', `<button class="btn btn-g" data-toast="Support chat opens here">${ic('life-buoy')}Contact support</button>`) + tabs(T);
    let body;
    if (st.tab === 0) {
      const ch = [['Getting around', 'The sidebar and your dashboard', 'dash-laptop', 0], ['Posting and bidding', 'From brief to first proposal', 'two-desk', 3], ['Getting paid', 'Milestones, escrow and payouts', 'pointing', 6], ['Mobile tips', 'Everything on the go', 'camera', 9]];
      body = `<div class="grid g-2-1"><div class="anim"><div class="player" id="player"><video id="pv" playsinline preload="metadata" poster="assets/video/laptop-dash.jpg" src="assets/video/laptop-dash.mp4"></video><button class="big-play" id="bigPlay" aria-label="Play">${ic('play')}</button><div class="pctrl"><button id="pp" aria-label="Play or pause">${ic('play')}</button><div class="pbar" id="pbar"><i id="pfill" style="width:0"></i></div><span class="ptime" id="ptime">0:00 / 0:12</span><button id="pmute" aria-label="Mute">${ic('volume-x')}</button><button id="pfs" aria-label="Fullscreen">${ic('maximize')}</button></div></div></div>
        <div class="card anim"><div class="card-h"><div><h3>Chapters</h3><p>4 parts / 12 seconds demo</p></div></div><div class="card-b chapters">${ch.map((c, i) => `<div class="chap${i === 0 ? ' on' : ''}" data-t="${c[3]}"><img src="assets/img/${c[2]}.jpg" alt="" loading="lazy"><span><b>${i + 1}. ${c[0]}</b><small>${c[1]}</small></span></div>`).join('')}</div></div></div>
        <div class="steps mt">${[['Set up your profile', 'Add a photo, skills and how you like to work.', 'teal'], ['Find or post work', 'Search, filter and save what fits.', 'purple'], ['Agree on milestones', 'Split work into small, clear steps.', 'orange'], ['Get paid safely', 'Money is held until work is approved.', 'green']].map((s, i) => `<div class="card step anim"><i class="n" style="background:${COLORS[s[2]]}22;color:${COLORS[s[2]]}">${i + 1}</i><b>${s[0]}</b><p>${s[1]}</p></div>`).join('')}</div>`;
    } else if (st.tab === 1) {
      const g = [['Your first week', 'A checklist to get set up fast.', 'team-laptops'], ['Writing a clear brief', 'Get better proposals in less time.', 'meeting'], ['Working in milestones', 'Small steps, less risk for everyone.', 'office-1'], ['Staying safe', 'Spot and report suspicious behavior.', 'circuit'], ['Building your profile', 'Show work that wins jobs.', 'portrait-blue'], ['Reading your reports', 'What every number means.', 'dash-laptop']];
      body = `<div class="grid g-3">${g.map(x => `<article class="card guide anim"><img src="assets/img/${x[2]}.jpg" alt="" loading="lazy"><div><b>${x[0]}</b><p>${x[1]}</p><a class="link" style="margin-top:10px" href="#" data-toast="Guide opens here">Read guide${ic('arrow-right')}</a></div></article>`).join('')}</div>`;
    } else {
      const q = [['How do payments work?', 'Clients fund a milestone before work starts. The money is held safely and released when the client approves the work.'], ['What fees does GigResource charge?', 'Fees depend on your user type and plan. See the Fees tab under Policies for the full breakdown.'], ['Can I switch between user types?', 'Yes. Use the switcher at the top of the sidebar. Your data for each type stays separate.'], ['How do disputes work?', 'If you cannot agree, open a dispute. Our team reviews messages and files and helps both sides reach a fair result.'], ['Is there a mobile app?', 'The website is built to work great on phones, tablets, laptops and desktops.'], ['How do I contact support?', 'Use the Contact support button on this page. We answer within a few hours.']];
      body = `<div class="card anim" style="padding:6px 22px"><div class="faq">${q.map((x, i) => `<details${i === 0 ? ' open' : ''}><summary>${x[0]}${ic('plus')}</summary><p>${x[1]}</p></details>`).join('')}</div></div>`;
    }
    return {
      head, body, mount() {
        const v = $('#pv');
        if (!v) return;
        const player = $('#player'), fill = $('#pfill'), time = $('#ptime');
        const fmt = s => `0:${String(Math.floor(s)).padStart(2, '0')}`;
        const setIcon = () => { $('#pp').innerHTML = ic(v.paused ? 'play' : 'pause'); icons(); };
        const toggle = () => { v.paused ? v.play() : v.pause(); };
        $('#bigPlay').addEventListener('click', toggle);
        $('#pp').addEventListener('click', toggle);
        v.addEventListener('click', toggle);
        v.muted = true;
        v.addEventListener('play', () => { player.classList.add('playing'); setIcon(); });
        v.addEventListener('pause', () => { player.classList.remove('playing'); setIcon(); });
        v.addEventListener('timeupdate', () => {
          fill.style.width = (v.currentTime / (v.duration || 12) * 100) + '%';
          time.textContent = `${fmt(v.currentTime)} / ${fmt(v.duration || 12)}`;
          const t = v.currentTime;
          $$('.chap', page).forEach(c => c.classList.toggle('on', t >= +c.dataset.t && t < +c.dataset.t + 3));
        });
        $('#pbar').addEventListener('click', e => { const b = e.currentTarget.getBoundingClientRect(); v.currentTime = (e.clientX - b.left) / b.width * (v.duration || 12); });
        $('#pmute').addEventListener('click', () => { v.muted = !v.muted; $('#pmute').innerHTML = ic(v.muted ? 'volume-x' : 'volume-2'); icons(); });
        $('#pfs').addEventListener('click', () => { (player.requestFullscreen || player.webkitRequestFullscreen || (() => {})).call(player); });
        $$('.chap', page).forEach(c => c.addEventListener('click', () => { v.currentTime = +c.dataset.t; v.play(); }));
        cleanups.push(() => v.pause());
      }
    };
  };

  const POLICY = [
    { t: 'Terms of Service', s: [['Who we are', 'GigResource connects clients, professionals, influencers and affiliates. These terms explain how the platform works and what we expect from everyone who uses it.'], ['Your account', 'Keep your details accurate and your password private. You are responsible for activity on your account. One person, one account per user type.'], ['Working together', 'Agree on scope, price and milestones before work starts. Keep all project communication and payments on GigResource so both sides stay protected.'], ['Payments', 'Clients fund milestones in advance. Funds are released when work is approved, or through dispute resolution when there is a disagreement.'], ['Ending an account', 'You can close your account at any time from Settings. We may suspend accounts that break these terms, with a clear reason.']] },
    { t: 'Privacy Policy', s: [['What we collect', 'Account details, profile information, messages and payment records that are needed to run the service.'], ['How we use it', 'To match work, process payments, keep the platform safe and improve the product. We never sell your personal data.'], ['Who can see it', 'Your public profile is visible to other users. Messages are visible only to the people in the conversation and, if needed, our trust team.'], ['Your choices', 'Download or delete your data from Settings. Change notification preferences at any time.'], ['Contact', 'Questions about privacy can be sent through the Help page.']] },
    { t: 'Fees', s: [['Clients', 'A small processing fee is added to each payment. There is no fee to post a job.'], ['Professionals', 'A service fee is taken from each milestone payment. The fee goes down as you earn more with the same client.'], ['Influencers', 'A flat fee per completed campaign, shown before you accept an offer.'], ['Affiliates', 'No fees. Commission is paid on the first jobs of every user you refer.'], ['Payouts', 'Standard payouts are free. Instant payouts cost 1%.']] },
    { t: 'Community Rules', s: [['Be honest', 'Represent your skills, reviews and identity truthfully.'], ['Be respectful', 'No harassment, hate speech or threats, in messages or in work.'], ['Stay on platform', 'Do not ask for payment or contact outside GigResource before a contract starts.'], ['Respect ownership', 'Only deliver work you have the rights to. Credit sources when needed.'], ['Report problems', 'If something feels wrong, report it. Our team reviews every report.']] }
  ];
  TPL.policy = (it, R) => {
    const P = POLICY[st.tab] || POLICY[0];
    const head = header(it, 'The rules that keep GigResource fair for everyone.', `<button class="btn btn-g" data-toast="PDF download started">${ic('download')}Download PDF</button>`) + tabs(POLICY.map(p => p.t));
    const body = `<div class="doc"><nav class="toc anim">${P.s.map((s, i) => `<a href="#" data-sec="${i}"${i === 0 ? ' class="on"' : ''}>${i + 1}. ${s[0]}</a>`).join('')}</nav><article class="card article anim"><span class="upd">${ic('calendar')}Last updated October 1, 2026</span><h2>${P.t}</h2><p>This page is part of the demo and shows how policy pages are laid out: easy to scan, with a contents list that follows you.</p><div class="callout">${ic('info')}<div>Short version: be clear, be fair, and keep work and payments on GigResource.</div></div>${P.s.map((s, i) => `<h3 id="sec${i}">${i + 1}. ${s[0]}</h3><p>${s[1]}</p>`).join('')}</article></div>`;
    return {
      head, body, mount() {
        $$('.toc a', page).forEach(a => a.addEventListener('click', e => {
          e.preventDefault();
          $$('.toc a', page).forEach(x => x.classList.toggle('on', x === a));
          $('#sec' + a.dataset.sec).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));
      }
    };
  };

  /* ================= charts ================= */
  let lineInst = null, donutInst = null;
  function chartDefaults() {
    Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
    Chart.defaults.color = '#66719a';
  }
  function lineChart(days) {
    const R = role(), r = rng(st.role + days);
    const n = days === 7 ? 7 : days === 30 ? 30 : 13;
    const labels = days === 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : days === 30 ? Array.from({ length: 30 }, (_, i) => (i % 5 === 0 ? `Oct ${i + 1}` : '')) : Array.from({ length: 13 }, (_, i) => 'W' + (i + 1));
    const base = R.chart.base * (days === 90 ? 6 : 1);
    let v = base;
    const cur = labels.map(() => (v = Math.max(base * .3, v + (r() - .4) * base * .35)));
    v = base * .85;
    const prev = labels.map(() => (v = Math.max(base * .25, v + (r() - .45) * base * .3)));
    const canvas = $('#line');
    if (!canvas) return;
    chartDefaults();
    if (lineInst) lineInst.destroy();
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 290);
    g.addColorStop(0, 'rgba(45,212,191,.32)');
    g.addColorStop(1, 'rgba(45,212,191,0)');
    lineInst = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [
        { label: 'This period', data: cur, borderColor: '#2dd4bf', backgroundColor: g, fill: true, tension: .42, borderWidth: 2.4, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#2dd4bf', pointHoverBorderColor: '#050816', pointHoverBorderWidth: 3 },
        { label: 'Last period', data: prev, borderColor: 'rgba(139,92,246,.75)', borderDash: [5, 5], fill: false, tension: .42, borderWidth: 1.8, pointRadius: 0, pointHoverRadius: 4 }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: true, align: 'end', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', color: '#9aa4c4', padding: 16 } },
          tooltip: { backgroundColor: '#0f1738', borderColor: 'rgba(148,163,255,.2)', borderWidth: 1, padding: 12, titleColor: '#e9edf9', bodyColor: '#9aa4c4', cornerRadius: 10, callbacks: { label: c => ` ${c.dataset.label}: ${R.chart.pre}${Math.round(c.raw).toLocaleString()}` } }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { autoSkip: false, maxRotation: 0 } },
          y: { grid: { color: 'rgba(148,163,255,.07)' }, border: { display: false }, ticks: { maxTicksLimit: 5, callback: v => R.chart.pre + (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : v) } }
        }
      }
    });
    cleanups.push(() => { if (lineInst) { lineInst.destroy(); lineInst = null; } });
  }
  function donutChart(dn) {
    const canvas = $('#donut');
    if (!canvas) return;
    chartDefaults();
    donutInst = new Chart(canvas, {
      type: 'doughnut',
      data: { labels: dn.labels, datasets: [{ data: dn.data, backgroundColor: [COLORS.teal, COLORS.purple, COLORS.orange, COLORS.navy], borderWidth: 0, spacing: 3, borderRadius: 6, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '76%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f1738', padding: 10, cornerRadius: 10 } }, animation: { animateRotate: true, duration: 1100 } }
    });
    cleanups.push(() => { if (donutInst) { donutInst.destroy(); donutInst = null; } });
  }

  /* ================= 3D globe (admin) ================= */
  function mountGlobe(el) {
    let alive = true, raf = 0, renderer;
    cleanups.push(() => { alive = false; cancelAnimationFrame(raf); if (renderer) { renderer.dispose(); renderer.forceContextLoss(); } });
    import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').then(THREE => {
      if (!alive) return;
      const w = el.clientWidth, h = el.clientHeight;
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
      renderer.setSize(w, h);
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(40, w / h, .1, 100);
      cam.position.set(0, 0, 6.2);
      const g = new THREE.Group();
      g.rotation.x = .35;
      scene.add(g);
      // dotted sphere
      const N = 2600, R = 1.9, pos = [], col = [];
      const cA = new THREE.Color('#2b3c7a'), cB = new THREE.Color('#6d8bff'), cT = new THREE.Color('#2dd4bf');
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = i * 2.399963;
        const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
        // fake continents with smooth noise
        const land = Math.sin(x * 3.1 + 1) * Math.cos(y * 2.7) + Math.sin(z * 2.3 - y * 1.7) > .35;
        if (!land && Math.random() > .18) continue;
        pos.push(x * R, y * R, z * R);
        const c = land ? (Math.random() > .93 ? cT : cB) : cA;
        col.push(c.r, c.g, c.b);
      }
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: .032, vertexColors: true, transparent: true, opacity: .95 })));
      // inner glow sphere
      g.add(new THREE.Mesh(new THREE.SphereGeometry(R * .985, 48, 48), new THREE.MeshBasicMaterial({ color: 0x0a1235, transparent: true, opacity: .85 })));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 48, 48), new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, depthWrite: false,
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.24,0.55,1.0,1.0) * i * 1.6; }'
      }));
      scene.add(halo);
      // arcs
      const toV = (lat, lon) => { const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-R * Math.sin(p) * Math.cos(t), R * Math.cos(p), R * Math.sin(p) * Math.sin(t)); };
      const cities = [[40.7, -74], [51.5, -.1], [35.7, 139.7], [1.35, 103.8], [-33.9, 151.2], [37.8, -122.4], [19.4, -99.1], [-23.5, -46.6], [28.6, 77.2], [52.5, 13.4], [5.6, -.2], [43.7, -79.4]];
      const arcs = [];
      const arcCols = [0x2dd4bf, 0x8b5cf6, 0xfb923c, 0x22c55e];
      for (let i = 0; i < 12; i++) {
        const a = toV(...cities[i % cities.length]), b = toV(...cities[(i * 5 + 3) % cities.length]);
        const mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R + a.distanceTo(b) * .45);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const pts = curve.getPoints(64);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: arcCols[i % 4], transparent: true, opacity: .9 });
        const line = new THREE.Line(geo, mat);
        geo.setDrawRange(0, 0);
        g.add(line);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 12), new THREE.MeshBasicMaterial({ color: arcCols[i % 4] }));
        dot.position.copy(b);
        g.add(dot);
        arcs.push({ geo, off: i * .37, dot });
      }
      cities.forEach(c => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(.028, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        m.position.copy(toV(...c)); g.add(m);
      });
      const clock = new THREE.Clock();
      let drag = null, vel = 0.0025;
      el.addEventListener('pointerdown', e => { drag = e.clientX; });
      window.addEventListener('pointerup', () => { drag = null; });
      el.addEventListener('pointermove', e => { if (drag !== null) { g.rotation.y += (e.clientX - drag) * .006; drag = e.clientX; } });
      (function loop() {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        const t = clock.getElapsedTime();
        if (drag === null) g.rotation.y += vel;
        arcs.forEach(a => {
          const p = ((t * .35 + a.off) % 2);
          const head = Math.min(65, Math.floor(Math.min(p, 1) * 65));
          const tail = p > 1 ? Math.floor((p - 1) * 65) : 0;
          a.geo.setDrawRange(tail, head - tail);
          a.dot.scale.setScalar(1 + Math.sin(t * 4 + a.off * 9) * .4);
        });
        renderer.render(scene, cam);
      })();
      const ro = new ResizeObserver(() => {
        const W = el.clientWidth, Hh = el.clientHeight;
        renderer.setSize(W, Hh); cam.aspect = W / Hh; cam.updateProjectionMatrix();
      });
      ro.observe(el);
      cleanups.push(() => ro.disconnect());
    }).catch(() => { el.innerHTML = '<div class="state" style="padding:40px">Live map unavailable</div>'; });
  }

  /* ================= common mount ================= */
  function mountCommon() {
    // counters
    $$('[data-to]', page).forEach(el => {
      const end = +el.dataset.to, pre = el.dataset.pre || '', suf = el.dataset.suf || '', dec = +(el.dataset.dec || 0);
      const o = { v: 0 };
      const fmt = v => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (!window.gsap) { el.textContent = fmt(end); return; }
      gsap.to(o, { v: end, duration: 1.5, ease: 'power3.out', delay: .15, onUpdate: () => { el.textContent = fmt(o.v); } });
    });
  }

  /* ================= global clicks ================= */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-go],[data-toast],[data-modal],[data-primary],[data-tab],[data-view],[data-sw]');
    if (!t) return;
    if (t.matches('a')) e.preventDefault();
    if (t.dataset.go) location.hash = `#/${st.role}/${t.dataset.go}`;
    else if (t.dataset.toast) toast(t.dataset.toast);
    else if (t.dataset.modal) openModal(t.dataset.modal);
    else if (t.hasAttribute('data-primary')) doPrimary();
    else if (t.dataset.tab !== undefined) {
      const k = +t.dataset.tab;
      if (k !== st.tab) location.hash = `#/${st.role}/${st.page}/${k}`;
    }
    else if (t.dataset.view) setView(t.dataset.view);
    else if (t.hasAttribute('data-sw')) { t.classList.toggle('on'); toast(t.classList.contains('on') ? 'Turned on' : 'Turned off'); }
  });
  function doPrimary() {
    const a = role().primary;
    if (a.modal) openModal(a.modal);
    else if (a.route) location.hash = `#/${st.role}/${a.route}`;
    else toast(a.toast);
  }

  function toast(msg) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="ic">${ic('check')}</i>${msg}`;
    box.appendChild(el);
    icons();
    gsap.fromTo(el, { y: 20, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .4, ease: 'back.out(1.6)' });
    setTimeout(() => gsap.to(el, { y: 10, opacity: 0, duration: .3, onComplete: () => el.remove() }), 2400);
  }

  /* ================= modals ================= */
  const MODALS = {
    job: { icon: 'briefcase', t: 'Post a job', p: 'Tell talent what you need. You can edit it later.', ok: 'Post job', done: 'Job posted', body: `<div class="fl"><label>Job title</label><input class="input" placeholder="e.g. Landing page redesign"></div><div class="frow"><div class="fl"><label>Category</label><select class="input"><option>Design</option><option>Development</option><option>Video</option><option>Writing</option></select></div><div class="fl"><label>Budget</label><input class="input" placeholder="$1,000 - $2,500"></div></div><div class="fl"><label>Description</label><textarea class="input" placeholder="What should the result look like?"></textarea></div>` },
    contract: { icon: 'file-signature', t: 'New contract', p: 'Set the scope and first milestone.', ok: 'Send offer', done: 'Contract offer sent', body: `<div class="fl"><label>Freelancer</label><select class="input"><option>Daniel Kim</option><option>Amara Osei</option><option>Marcus Bell</option></select></div><div class="frow"><div class="fl"><label>Milestone 1</label><input class="input" value="Sidebar system"></div><div class="fl"><label>Amount</label><input class="input" value="$120"></div></div>` },
    bid: { icon: 'send', t: 'Send a bid', p: 'Keep it short and specific to the job.', ok: 'Send bid', done: 'Bid sent', body: `<div class="frow"><div class="fl"><label>Your bid</label><input class="input" value="$450"></div><div class="fl"><label>Delivery</label><select class="input"><option>10 days</option><option>2 weeks</option><option>1 month</option></select></div></div><div class="fl"><label>Cover letter</label><textarea class="input">I can start right away. Here is how I would split this into milestones...</textarea></div>` },
    content: { icon: 'upload', t: 'Upload content', p: 'Add a video or photo to a campaign.', ok: 'Upload', done: 'Upload started', body: `<div class="drop">${ic('cloud-upload')}<b style="color:var(--text)">Drop files here</b>MP4, MOV, JPG or PNG, up to 500 MB</div><div class="frow"><div class="fl"><label>Campaign</label><select class="input"><option>Summer Glow Launch</option><option>Morning Ritual</option></select></div><div class="fl"><label>Publish</label><select class="input"><option>Now</option><option>Schedule</option></select></div></div>` },
    link: { icon: 'link', t: 'Create a referral link', p: 'Track clicks and sign-ups from anywhere you share it.', ok: 'Create link', done: 'Link created and copied', body: `<div class="fl"><label>Link name</label><input class="input" placeholder="e.g. Winter newsletter"></div><div class="fl"><label>Send people to</label><select class="input"><option>Home page</option><option>Client sign-up</option><option>Professional sign-up</option></select></div>` },
    invite: { icon: 'user-plus', t: 'Invite a user', p: 'They get an email with a sign-up link.', ok: 'Send invite', done: 'Invite sent', body: `<div class="fl"><label>Email</label><input class="input" placeholder="name@company.com"></div><div class="fl"><label>User type</label><select class="input"><option>Client</option><option>Professional</option><option>Influencer</option><option>Affiliate</option><option>Admin</option></select></div>` },
    withdraw: { icon: 'wallet', t: 'Move money', p: 'Choose an amount and where it goes.', ok: 'Confirm', done: 'Request submitted', body: `<div class="fl"><label>Amount</label><input class="input" value="$1,000"></div><div class="fl"><label>Method</label><select class="input"><option>Bank account ending 4821</option><option>Card ending 4242</option></select></div><div class="callout">${ic('info')}<div>Standard transfers arrive in 1 to 2 business days.</div></div>` }
  };
  const mw = $('#modalWrap'), modal = $('#modal');
  let lastFocus = null;
  function openModal(k) {
    const m = MODALS[k];
    if (!m) return;
    lastFocus = document.activeElement;
    modal.innerHTML = `<div class="modal-h"><span class="ic">${ic(m.icon)}</span><div><h3>${m.t}</h3><p>${m.p}</p></div><button class="icon-btn x" data-close aria-label="Close">${ic('x')}</button></div><div class="modal-b">${m.body}</div><div class="modal-f"><button class="btn btn-g" data-close>Cancel</button><button class="btn btn-p" data-ok>${ic('check')}${m.ok}</button></div>`;
    icons();
    mw.classList.add('open');
    setTimeout(() => { const f = $('input, select, textarea', modal); if (f) f.focus(); }, 300);
    modal.onclick = e => {
      if (e.target.closest('[data-close]')) closeModal();
      if (e.target.closest('[data-ok]')) { closeModal(); toast(m.done + ' (demo)'); }
    };
  }
  function closeModal() { mw.classList.remove('open'); if (lastFocus) lastFocus.focus(); }
  mw.addEventListener('click', e => { if (e.target === mw) closeModal(); });

  /* ================= keyboard ================= */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (mw.classList.contains('open')) closeModal();
      else if (roleMenu.classList.contains('open')) roleMenu.classList.remove('open');
      else closeNav();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const s = $('.search input');
      if (s && s.offsetParent) s.focus();
    }
  });

  /* ================= sidebar promo video ================= */
  const pv = $('#promo video');
  if (pv && !EMBED) { pv.src = pv.dataset.src; pv.play().catch(() => {}); }

  /* ================= boot ================= */
  lastBand = window.innerWidth < 768 ? 0 : window.innerWidth < 1440 ? 1 : 2;
  applyMode();
  route();
  window.addEventListener('load', moveInd);
})();
