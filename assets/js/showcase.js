(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.lucide) lucide.createIcons();
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -20 });
    }));
  }

  /* ---------- preloader ---------- */
  const loader = $('#loader');
  const num = $('#loadNum');
  const bar = $('#loadBar');
  if (lenis) lenis.stop();
  const prog = { v: 0 };
  let pageReady = document.readyState === 'complete';
  window.addEventListener('load', () => { pageReady = true; });
  const counter = gsap.to(prog, {
    v: 92, duration: 1.6, ease: 'power2.out',
    onUpdate: () => { num.textContent = Math.round(prog.v); bar.style.width = prog.v + '%'; }
  });
  const waitReady = () => new Promise(res => {
    const start = Date.now();
    (function check() { if (pageReady || Date.now() - start > 3500) res(); else setTimeout(check, 80); })();
  });
  Promise.all([waitReady(), new Promise(r => setTimeout(r, 1600))]).then(() => {
    counter.kill();
    gsap.to(prog, {
      v: 100, duration: .35, ease: 'none',
      onUpdate: () => { num.textContent = Math.round(prog.v); bar.style.width = prog.v + '%'; },
      onComplete: outro
    });
  });
  function outro() {
    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    tl.to('.loader-inner', { y: -40, opacity: 0, duration: .5, ease: 'power3.in' })
      .to('.loader-panels span', { scaleY: 0, duration: .9, ease: 'expo.inOut', stagger: .07 }, '-=.1')
      .add(() => window.dispatchEvent(new Event('gr:loaded')), '-=.7')
      .from('.hero h1 .line > span', { yPercent: 110, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .12 }, '-=.55')
      .from('.h-in', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1 }, '-=1')
      .from('.nav', { y: -30, opacity: 0, duration: .8, ease: 'expo.out' }, '-=1')
      .add(runCounters, '-=.6');
  }

  function runCounters() {
    $$('[data-count]').forEach(el => {
      const o = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || '';
      gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; } });
    });
  }

  /* ---------- nav ---------- */
  const nav = $('#nav');
  ScrollTrigger.create({ start: 80, onUpdate: s => nav.classList.toggle('scrolled', s.scroll() > 80) });

  /* ---------- cursor + magnetic ---------- */
  const cur = $('.cursor'), dot = $('.cursor-dot');
  if (matchMedia('(hover: hover)').matches) {
    const xTo = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', e => {
      xTo(e.clientX); yTo(e.clientY);
      gsap.set(dot, { x: e.clientX, y: e.clientY });
    });
    $$('a, button, .compare').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cur.classList.remove('is-hover'));
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* ---------- reveals ---------- */
  ScrollTrigger.batch('.rv', {
    start: 'top 88%',
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, overwrite: true })
  });

  /* ---------- lazy videos (play only when on screen) ---------- */
  const vids = $$('video[data-src]').filter(v => !v.closest('.role'));
  const vio = new IntersectionObserver(entries => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; v.load(); }
        v.play().catch(() => {});
      } else if (v.src) v.pause();
    });
  }, { rootMargin: '200px 0px' });
  vids.forEach(v => vio.observe(v));

  /* ---------- hero parallax ---------- */
  gsap.to('.hero-media video', { yPercent: 18, scale: 1.18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero .wrap', { yPercent: -12, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- compare slider ---------- */
  const cmp = $('#compare');
  if (cmp) {
    let drag = false;
    const set = x => {
      const r = cmp.getBoundingClientRect();
      const p = Math.max(4, Math.min(96, (x - r.left) / r.width * 100));
      cmp.style.setProperty('--pos', p + '%');
    };
    cmp.addEventListener('pointerdown', e => { drag = true; cmp.setPointerCapture(e.pointerId); set(e.clientX); });
    cmp.addEventListener('pointermove', e => { if (drag) set(e.clientX); });
    cmp.addEventListener('pointerup', () => { drag = false; });
    cmp.addEventListener('pointercancel', () => { drag = false; });
    const o = { p: 50 };
    ScrollTrigger.create({
      trigger: cmp, start: 'top 70%', once: true,
      onEnter: () => gsap.timeline()
        .to(o, { p: 18, duration: 1.1, ease: 'power3.inOut', onUpdate: () => cmp.style.setProperty('--pos', o.p + '%') })
        .to(o, { p: 78, duration: 1.4, ease: 'power3.inOut', onUpdate: () => cmp.style.setProperty('--pos', o.p + '%') })
        .to(o, { p: 50, duration: 1, ease: 'power3.inOut', onUpdate: () => cmp.style.setProperty('--pos', o.p + '%') })
    });
    gsap.fromTo(cmp, { rotateX: 14, transformPerspective: 1600, scale: .94 }, { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: cmp, start: 'top bottom', end: 'top 35%', scrub: true } });
  }

  /* ---------- sidebar playground ---------- */
  const ROLES = {
    client: { n: 'Client', c: '#2dd4bf', items: [['layout-dashboard', 'Dashboard'], ['briefcase', 'My Jobs', 3], ['inbox', 'Proposals', 12], ['message-square', 'Messages', 5], ['file-text', 'Contracts'], ['wallet', 'Payments'], ['settings', 'Settings']] },
    professional: { n: 'Professional', c: '#8b5cf6', items: [['layout-dashboard', 'Dashboard'], ['search', 'Find Work'], ['send', 'My Bids', 4], ['folder-kanban', 'Projects'], ['message-square', 'Messages', 2], ['banknote', 'Earnings'], ['user-round', 'Profile']] },
    influencer: { n: 'Influencer', c: '#fb923c', items: [['layout-dashboard', 'Dashboard'], ['megaphone', 'Campaigns', 2], ['gift', 'Offers', 6], ['clapperboard', 'Content'], ['message-square', 'Messages', 3], ['banknote', 'Earnings'], ['user-round', 'Profile']] },
    admin: { n: 'Admin', c: '#6d8bff', items: [['gauge', 'Overview'], ['users', 'Users'], ['bar-chart-3', 'Reports'], ['shield-alert', 'Disputes', 7], ['landmark', 'Payouts'], ['message-square', 'Messages', 1], ['settings', 'Settings']] },
    affiliate: { n: 'Affiliate', c: '#22c55e', items: [['layout-dashboard', 'Dashboard'], ['link', 'Referral Links'], ['users-round', 'Referrals', 9], ['percent', 'Commissions'], ['message-square', 'Messages'], ['settings', 'Settings']] },
  };
  const stage = $('#stage');
  if (stage) {
    const psNav = $('#psNav'), ind = $('#psInd'), tip = $('#psTip');
    let role = 'client', active = 0, stateDemo = 'active';
    const chipsWrap = $('#roleChips');
    Object.entries(ROLES).forEach(([k, r], i) => {
      const b = document.createElement('button');
      b.className = 'chip' + (i === 0 ? ' on' : '');
      b.dataset.role = k;
      b.innerHTML = `<i class="dot" style="background:${r.c}"></i>${r.n}`;
      chipsWrap.appendChild(b);
    });
    function render() {
      const r = ROLES[role];
      $$('.ps-item', psNav).forEach(n => n.remove());
      r.items.forEach(([ic, label, badge], i) => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'ps-item' + (i === active ? ' on' : '');
        a.dataset.i = i;
        a.innerHTML = `<i data-lucide="${ic}"></i><span class="label">${label}</span>${badge ? `<span class="pill">${badge}</span>` : ''}`;
        psNav.appendChild(a);
      });
      lucide.createIcons({ nameAttr: 'data-lucide' });
      $('#psRoleName').textContent = r.n;
      const ri = $('#psRoleIcon');
      ri.textContent = r.n[0];
      ri.style.background = r.c;
      $('#psTitle').textContent = r.items[active] ? r.items[active][1] : 'Dashboard';
      moveInd();
      applyState();
    }
    function moveInd() {
      const el = $$('.ps-item', psNav)[active];
      if (!el) return;
      ind.style.transform = `translateY(${el.offsetTop}px)`;
    }
    function applyState() {
      const items = $$('.ps-item', psNav);
      items.forEach(n => n.classList.remove('f-hover', 'f-focus', 'f-badge'));
      tip.classList.remove('show');
      const target = items.find(n => n.querySelector('.pill') && +n.dataset.i !== active) || items[2];
      if (stateDemo === 'hover') items[(active + 1) % items.length].classList.add('f-hover');
      if (stateDemo === 'focus') items[(active + 2) % items.length].classList.add('f-focus');
      if (stateDemo === 'badge') target.classList.add('f-badge');
      if (stateDemo === 'tooltip') {
        if (stage.dataset.mode !== 'collapsed') setMode('collapsed');
        const msg = items.find(n => n.textContent.includes('Messages')) || items[3];
        setTimeout(() => showTip(msg), 650);
      }
    }
    function showTip(el) {
      const sr = $('#psScreen').getBoundingClientRect(), er = el.getBoundingClientRect();
      tip.textContent = el.querySelector('.label').textContent;
      tip.style.top = (er.top - sr.top + er.height / 2 - 15) + 'px';
      tip.style.left = (er.right - sr.left + 12) + 'px';
      tip.classList.add('show');
    }
    function setMode(m) {
      stage.dataset.mode = m;
      stage.classList.remove('drawer-open');
      $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
      if (m === 'mobile') setTimeout(() => stage.classList.add('drawer-open'), 700);
      setTimeout(moveInd, 650);
    }
    psNav.addEventListener('click', e => {
      const a = e.target.closest('.ps-item');
      if (!a) return;
      e.preventDefault();
      active = +a.dataset.i;
      $$('.ps-item', psNav).forEach(n => n.classList.toggle('on', n === a));
      $('#psTitle').textContent = a.querySelector('.label').textContent;
      moveInd();
      if (stage.dataset.mode === 'mobile') setTimeout(() => stage.classList.remove('drawer-open'), 250);
    });
    psNav.addEventListener('mouseover', e => {
      const a = e.target.closest('.ps-item');
      if (a && stage.dataset.mode === 'collapsed') showTip(a);
    });
    psNav.addEventListener('mouseleave', () => { if (stateDemo !== 'tooltip') tip.classList.remove('show'); });
    $('#modeSeg').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (stateDemo === 'tooltip' && b.dataset.mode !== 'collapsed') { stateDemo = 'active'; $$('#stateChips .chip').forEach(c => c.classList.toggle('on', c.dataset.st === 'active')); tip.classList.remove('show'); }
      setMode(b.dataset.mode);
    });
    chipsWrap.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      role = b.dataset.role; active = 0;
      $$('.chip', chipsWrap).forEach(c => c.classList.toggle('on', c === b));
      gsap.fromTo('#ps', { opacity: .4 }, { opacity: 1, duration: .5 });
      render();
    });
    $('#stateChips').addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      stateDemo = b.dataset.st;
      $$('#stateChips .chip').forEach(c => c.classList.toggle('on', c === b));
      applyState();
    });
    $('#psBurger').addEventListener('click', () => stage.classList.toggle('drawer-open'));
    $('#psScrim').addEventListener('click', () => stage.classList.remove('drawer-open'));
    window.addEventListener('resize', moveInd);
    render();
    gsap.fromTo('#psScreen', { rotateY: -18, rotateX: 8 }, { rotateY: 0, rotateX: 0, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'center center', scrub: true } });
  }

  /* ---------- devices: live iframes, scaled ---------- */
  const screens = $$('.screen[data-w]');
  function scaleScreens() {
    screens.forEach(s => {
      const f = s.querySelector('iframe');
      const w = +s.dataset.w, h = +s.dataset.h;
      f.style.width = w + 'px';
      f.style.height = h + 'px';
      f.style.transform = `scale(${s.clientWidth / w})`;
    });
  }
  scaleScreens();
  window.addEventListener('resize', scaleScreens);
  const fio = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting && !target.src) { target.src = target.dataset.src; fio.unobserve(target); }
    });
  }, { rootMargin: '900px 0px' });
  screens.forEach(s => fio.observe(s.querySelector('iframe')));

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '#devicesPin', start: 'top top', end: '+=120%', scrub: 1, pin: true, anticipatePin: 1 }
    });
    tl.from('.dev-desktop', { y: 160, rotateX: 38, scale: .82, opacity: 0, ease: 'power2.out' }, 0)
      .from('.dev-laptop', { x: -260, rotateY: 38, z: -300, opacity: 0, ease: 'power2.out' }, .12)
      .from('.dev-phone', { x: 220, rotateY: -42, z: -300, opacity: 0, ease: 'power2.out' }, .2)
      .to('.dev-desktop', { y: -10, ease: 'none' }, .8);

    // horizontal states
    const track = $('#statesTrack');
    const dist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '#statesPin', start: 'top top', end: () => '+=' + dist(), scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1 }
    });
  });
  mm.add('(max-width: 860px)', () => {
    const track = $('#statesTrack');
    track.style.overflowX = 'auto';
    track.style.width = '100%';
    track.style.scrollSnapType = 'x mandatory';
    $$('.scard', track).forEach(c => { c.style.scrollSnapAlign = 'center'; });
    return () => { track.removeAttribute('style'); };
  });

  /* ---------- mini tabs auto-cycle ---------- */
  const mt = $('#miniTabs');
  if (mt) {
    const tabs = $$('span', mt), bar = $('i', mt);
    let k = 0;
    const go = () => {
      tabs.forEach((t, i) => t.classList.toggle('on', i === k));
      bar.style.left = tabs[k].offsetLeft + 'px';
      bar.style.width = tabs[k].offsetWidth + 'px';
    };
    go();
    setInterval(() => { k = (k + 1) % tabs.length; go(); }, 1800);
  }

  /* ---------- roles: tilt + hover video ---------- */
  $$('.role').forEach(card => {
    const v = $('video', card);
    card.addEventListener('mouseenter', () => {
      if (!v.src) { v.src = v.dataset.src; }
      v.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      v.pause();
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'expo.out' });
    });
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      gsap.to(card, { rotateY: (px - .5) * 8, rotateX: (.5 - py) * 8, transformPerspective: 1000, duration: .6, ease: 'power3' });
    });
  });
  // touch devices: play role videos when visible
  if (matchMedia('(hover: none)').matches) {
    const rio = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }), { threshold: .4 });
    $$('.role video').forEach(v => rio.observe(v));
  }

  /* ---------- film strips ---------- */
  gsap.fromTo('#strip1', { x: 0 }, { x: () => -(($('#strip1').scrollWidth - window.innerWidth) * .8), ease: 'none', scrollTrigger: { trigger: '#reel', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  gsap.fromTo('#strip2', { x: () => -(($('#strip2').scrollWidth - window.innerWidth) * .8) }, { x: 0, ease: 'none', scrollTrigger: { trigger: '#reel', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  gsap.from('.reel-title .h2', { scale: .86, ease: 'none', scrollTrigger: { trigger: '#reel', start: 'top bottom', end: 'top 30%', scrub: true } });

  /* ---------- plan line draw ---------- */
  const path = $('#planPath');
  if (path) {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.plan-grid', start: 'top 85%', end: 'top 40%', scrub: true } });
  }
  $$('.mcard .price').forEach(p => {
    const end = +p.textContent.replace(/\D/g, '');
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: p, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.4, ease: 'power3.out', onUpdate: () => { p.textContent = '$' + Math.round(o.v); } }) });
  });

  /* ---------- final ---------- */
  gsap.from('.final h2', { yPercent: 30, scale: .9, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'top 15%', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
