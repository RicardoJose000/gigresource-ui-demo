import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('heroCanvas');
if (canvas) init();

function glowTexture(hex) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, hex);
  grad.addColorStop(.25, hex + 'aa');
  grad.addColorStop(1, hex + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050816, 0.045);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // lights
  scene.add(new THREE.AmbientLight(0x6d8bff, 0.35));
  const key = new THREE.PointLight(0x2dd4bf, 60, 30); key.position.set(4, 3, 6); scene.add(key);
  const rim = new THREE.PointLight(0x8b5cf6, 70, 30); rim.position.set(-5, -2, 3); scene.add(rim);
  const warm = new THREE.PointLight(0xfb923c, 25, 20); warm.position.set(2, -4, 4); scene.add(warm);
  const front = new THREE.DirectionalLight(0xbfd0ff, 1.4); front.position.set(-2, 3, 8); scene.add(front);

  const world = new THREE.Group();
  scene.add(world);
  const rig = new THREE.Group();
  world.add(rig);

  // core: faceted crystal + wire shell + inner glow
  const coreGeo = new THREE.IcosahedronGeometry(1.45, 1);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
    color: 0x2a3f9a, metalness: .45, roughness: .22, flatShading: true, emissive: 0x13206e, emissiveIntensity: .9
  }));
  rig.add(core);
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.75, 1)),
    new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: .45 })
  );
  rig.add(wire);
  const shell2 = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.25, 0)),
    new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: .22 })
  );
  rig.add(shell2);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#5eead4'), blending: THREE.AdditiveBlending, transparent: true, opacity: .55, depthWrite: false }));
  coreGlow.scale.set(6.5, 6.5, 1);
  rig.add(coreGlow);

  // five user-type orbits
  const roles = [
    { c: '#2dd4bf', r: 3.1, tilt: [1.2, 0, .3], speed: .42 },
    { c: '#8b5cf6', r: 3.7, tilt: [1.0, .6, -.2], speed: .33 },
    { c: '#fb923c', r: 4.3, tilt: [1.4, -.5, .5], speed: .27 },
    { c: '#6d8bff', r: 4.9, tilt: [.8, .3, .9], speed: .21 },
    { c: '#22c55e', r: 5.5, tilt: [1.3, -.8, -.6], speed: .17 },
  ];
  const moons = [];
  const linkPos = new Float32Array(roles.length * 6);
  roles.forEach((o, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(...o.tilt);
    rig.add(pivot);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(o.r, 0.007, 8, 220),
      new THREE.MeshBasicMaterial({ color: o.c, transparent: true, opacity: .32 })
    );
    pivot.add(ring);
    const holder = new THREE.Group();
    pivot.add(holder);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 32, 32),
      new THREE.MeshStandardMaterial({ color: o.c, emissive: o.c, emissiveIntensity: 1.6, roughness: .3 })
    );
    moon.position.x = o.r;
    holder.add(moon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(o.c), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    halo.scale.set(1.5, 1.5, 1);
    moon.add(halo);
    // trailing comet
    const trailN = 40;
    const tg = new THREE.BufferGeometry();
    const tp = new Float32Array(trailN * 3);
    for (let k = 0; k < trailN; k++) {
      const a = -k * 0.025;
      tp[k * 3] = Math.cos(a) * o.r; tp[k * 3 + 1] = Math.sin(a) * o.r; tp[k * 3 + 2] = 0;
    }
    tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
    const cols = new Float32Array(trailN * 3);
    const cc = new THREE.Color(o.c);
    for (let k = 0; k < trailN; k++) { const f = 1 - k / trailN; cols[k * 3] = cc.r * f; cols[k * 3 + 1] = cc.g * f; cols[k * 3 + 2] = cc.b * f; }
    tg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .9, blending: THREE.AdditiveBlending }));
    holder.add(trail);
    holder.rotation.z = i * 1.3;
    moons.push({ holder, moon, speed: o.speed });
  });
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
  const links = new THREE.LineSegments(linkGeo, new THREE.LineBasicMaterial({ color: 0x9fb3ff, transparent: true, opacity: .16 }));
  rig.add(links);

  // particle field
  const N = window.innerWidth < 700 ? 900 : 2200;
  const pg = new THREE.BufferGeometry();
  const pp = new Float32Array(N * 3);
  const pc = new Float32Array(N * 3);
  const palette = [new THREE.Color('#2dd4bf'), new THREE.Color('#8b5cf6'), new THREE.Color('#9fb3ff'), new THREE.Color('#fb923c'), new THREE.Color('#ffffff')];
  for (let i = 0; i < N; i++) {
    const r = 6 + Math.random() * 16;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pp[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * .6;
    pp[i * 3 + 2] = r * Math.cos(ph) - 4;
    const c = palette[Math.random() < .55 ? 2 : Math.floor(Math.random() * palette.length)];
    pc[i * 3] = c.r; pc[i * 3 + 1] = c.g; pc[i * 3 + 2] = c.b;
  }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const stars = new THREE.Points(pg, new THREE.PointsMaterial({
    size: .05, vertexColors: true, transparent: true, opacity: .85, depthWrite: false,
    blending: THREE.AdditiveBlending, map: glowTexture('#ffffff')
  }));
  scene.add(stars);

  // interaction
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / window.innerWidth - .5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  let scrollP = 0;
  window.addEventListener('scroll', () => {
    scrollP = Math.min(1, window.scrollY / window.innerHeight);
  }, { passive: true });

  let layoutX = 0;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 960;
    layoutX = wide ? 4.3 : 0;
    world.scale.setScalar(wide ? .9 : .78);
    canvas.style.opacity = wide ? 1 : .55;
  }
  resize();
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 }).observe(canvas);

  // intro: scale up from nothing once the loader is gone
  let intro = 0;
  window.addEventListener('gr:loaded', () => { intro = 0.0001; });
  setTimeout(() => { if (!intro) intro = 0.0001; }, 4500);

  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    if (intro > 0 && intro < 1) intro = Math.min(1, intro + dt * .7);
    const e = 1 - Math.pow(1 - intro, 3);

    mouse.x += (mouse.tx - mouse.x) * .05;
    mouse.y += (mouse.ty - mouse.y) * .05;

    rig.scale.setScalar(.2 + e * .8);
    rig.rotation.y = t * .12 + mouse.x * .35;
    rig.rotation.x = mouse.y * .25 + scrollP * .6;
    core.rotation.set(t * .3, t * .22, 0);
    wire.rotation.set(-t * .18, t * .12, 0);
    shell2.rotation.set(t * .08, -t * .1, t * .05);
    coreGlow.material.opacity = .45 + Math.sin(t * 2) * .08;

    moons.forEach((m, i) => {
      m.holder.rotation.z += dt * m.speed;
      m.moon.getWorldPosition(v);
      rig.worldToLocal(v);
      linkPos[i * 6] = 0; linkPos[i * 6 + 1] = 0; linkPos[i * 6 + 2] = 0;
      linkPos[i * 6 + 3] = v.x; linkPos[i * 6 + 4] = v.y; linkPos[i * 6 + 5] = v.z;
    });
    linkGeo.attributes.position.needsUpdate = true;

    stars.rotation.y = t * .015 + mouse.x * .05;
    stars.rotation.x = mouse.y * .03;

    world.position.x = layoutX - scrollP * 1.5;
    world.position.y = scrollP * 1.2;
    camera.position.z = 11 + scrollP * 4;
    camera.position.x = mouse.x * .4;
    camera.position.y = -mouse.y * .3;
    camera.lookAt(world.position.x * .4, 0, 0);

    renderer.render(scene, camera);
  }
  tick();
}
