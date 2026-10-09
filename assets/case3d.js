// The home-page suitcase in WebGL: a rounded aluminium carry-on (55 × 40 × 23 cm proportions) with the
// project stickers printed onto its faces. On load the front panel deepens into the case, the case turns
// to a three-quarter view, the handle and wheels pop on and the stickers are pressed on one by one; then
// it holds still. Clicking a sticker opens the same link as the hidden sticker list in the page.
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const canvas = document.getElementById('case3d');
const stage = canvas.parentNode;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// body size in scene units: width 1, height and depth in carry-on proportion; corner radius like a real shell
const W = 1, H = 1.287, D = 0.46, R = 0.075;
// texture size per face, matching each face's shape so stickers keep their aspect
const PX = { front: [1024, 1318], back: [1024, 1318], right: [400, 1120], left: [400, 1120], top: [1024, 472], bottom: [1024, 472] };
const BASE = { front: 'face.webp', back: 'face-back.webp', right: 'side.webp', left: 'side.webp', top: 'top.webp', bottom: 'top.webp' };

const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

// stickers come from the page's own links: position, width and tilt as % of their face
const stickers = [];
document.querySelectorAll('.stk-list [data-face]').forEach(group => {
  group.querySelectorAll('a').forEach(a => {
    const st = a.style;
    stickers.push({ face: group.dataset.face, href: a.getAttribute('href'), label: a.getAttribute('aria-label'),
      src: a.querySelector('img').getAttribute('src'),
      l: parseFloat(st.left) / 100, t: parseFloat(st.top) / 100, w: parseFloat(st.width) / 100,
      r: parseFloat(st.getPropertyValue('--r')) * Math.PI / 180 });
  });
});
// pressed on front first, then round the case
const order = ['front', 'right', 'back', 'left'];
stickers.sort((a, b) => order.indexOf(a.face) - order.indexOf(b.face));
stickers.forEach((s, i) => { s.i = i; });

function fail() { document.documentElement.classList.add('no3d'); }

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0.3, 4.15);
  camera.lookAt(0, -0.02, 0);

  // soft key light from the upper left, the room reflections do the rest
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-2, 3, 3);
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 0.35));

  // images: face textures and every sticker
  const [bases, imgs] = await Promise.all([
    Promise.all(Object.entries(BASE).map(async ([k, f]) => [k, await load('assets/img/home/' + f)])).then(Object.fromEntries),
    Promise.all(stickers.map(s => load(s.src)))
  ]);
  stickers.forEach((s, i) => { s.img = imgs[i]; });

  // one canvas texture per face; stickers are drawn into it so they sit exactly on the shell
  const faces = {};
  for (const k of Object.keys(PX)) {
    const c = document.createElement('canvas');
    [c.width, c.height] = PX[k];
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    faces[k] = { c, g: c.getContext('2d'), tex, list: stickers.filter(s => s.face === k) };
  }
  let hot = null;
  function paint(k, now) {
    const f = faces[k], g = f.g, cw = f.c.width, ch = f.c.height;
    g.drawImage(bases[k], 0, 0, cw, ch);
    if (k === 'bottom') { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, cw, ch); }
    for (const s of f.list) {
      const p = now == null ? 1 : Math.min(1, Math.max(0, (now - 1.85 - s.i * 0.06) / 0.34));
      if (p <= 0) continue;
      const w = s.w * cw, h = w * s.img.height / s.img.width;
      // pressed on: a little larger and more tilted, settling flat with a slight overshoot
      const e = 1 + 1.7 * Math.pow(p - 1, 3) + 0.7 * Math.pow(p - 1, 2);
      const sc = 1 + 0.25 * (1 - e);
      g.save();
      g.globalAlpha = Math.min(1, p * 2);
      g.translate(s.l * cw + w / 2, s.t * ch + h / 2);
      g.rotate(s.r * (1 + 2 * (1 - e)));
      g.scale(sc, sc);
      g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5;
      g.drawImage(s.img, -w / 2, -h / 2, w, h);
      if (s === hot) { g.shadowColor = 'transparent'; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12; g.drawImage(s.img, -w / 2, -h / 2, w, h); }
      g.restore();
      s.box = { cx: s.l * cw + w / 2, cy: s.t * ch + h / 2, w, h, cw, ch };
    }
    f.tex.needsUpdate = true;
  }
  Object.keys(faces).forEach(k => paint(k, reduce ? null : 0));

  // the shell: brushed aluminium, a touch of metal so the stickers keep their colour
  const mat = k => new THREE.MeshStandardMaterial({ map: faces[k].tex, metalness: 0.25, roughness: 0.42, envMapIntensity: 0.55 });
  // RoundedBoxGeometry face order: +x, -x, +y, -y, +z, -z
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, R), ['right', 'left', 'top', 'bottom', 'front', 'back'].map(mat));
  const kase = new THREE.Group();
  kase.add(body);

  // carry handle on the lid
  const metal = new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 0.8, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1f2124, metalness: 0.1, roughness: 0.6 });
  const handle = new THREE.Group();
  const path = new THREE.CatmullRomCurve3([[-0.17, 0], [-0.17, 0.06], [-0.13, 0.095], [0, 0.1], [0.13, 0.095], [0.17, 0.06], [0.17, 0]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  handle.add(new THREE.Mesh(new THREE.TubeGeometry(path, 48, 0.02, 12), metal));
  for (const x of [-0.17, 0.17]) { const foot = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.03, 0.1, 2, 0.012), metal); foot.position.set(x, 0, 0); handle.add(foot); }
  handle.position.y = H / 2;
  kase.add(handle);

  // four spinner wheels under the corners
  const wheels = new THREE.Group();
  for (const x of [-0.4, 0.4]) for (const z of [-0.15, 0.15]) {
    const w = new THREE.Group();
    const housing = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.05, 0.09, 2, 0.015), metal);
    housing.position.y = -0.02;
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 24), dark);
    tyre.rotation.z = Math.PI / 2; tyre.position.y = -0.075;
    w.add(housing, tyre); w.position.set(x, -H / 2, z);
    wheels.add(w);
  }
  kase.add(wheels);
  kase.position.y = 0.04;
  scene.add(kase);

  // soft contact shadow on the floor, turning with the case
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const sg = sc.getContext('2d'), grad = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,.42)'); grad.addColorStop(0.45, 'rgba(0,0,0,.2)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 256, 256);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.5, D * 2.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -H / 2 - 0.125;
  kase.add(floor);

  function fit() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  fit();

  // final pose: three-quarter view showing the front and the right side, looking slightly down onto the lid
  const END = { ry: -0.55, rx: 0.1 };
  const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
  const back = t => { t = Math.min(1, Math.max(0, t)); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  function pose(t) {
    const deepen = ease(t / 0.9), turn = ease((t - 0.6) / 1.0);
    canvas.style.opacity = Math.min(1, t / 0.35);
    kase.scale.set(0.9 + 0.1 * deepen, 0.9 + 0.1 * deepen, 0.04 + 0.96 * deepen);
    kase.rotation.set(END.rx * turn, END.ry * turn, 0);
    handle.scale.setScalar(Math.max(0.001, back((t - 1.35) / 0.4)));
    wheels.children.forEach((w, i) => w.scale.setScalar(Math.max(0.001, back((t - 1.45 - i * 0.05) / 0.35))));
  }

  const draw = () => renderer.render(scene, camera);
  if (reduce) { pose(9); draw(); }
  else {
    const t0 = performance.now();
    const END_T = 1.85 + stickers.length * 0.06 + 0.4;
    (function tick(now) {
      const t = (now - t0) / 1000;
      pose(t);
      if (t > 1.8) Object.keys(faces).forEach(k => { if (faces[k].list.length) paint(k, t); });
      draw();
      if (t < END_T) requestAnimationFrame(tick);
      else { Object.keys(faces).forEach(k => paint(k, null)); draw(); }
    })(t0);
  }
  // refit whenever the canvas changes size (window resize, or the page appearing after the access gate)
  new ResizeObserver(() => { fit(); draw(); }).observe(canvas);

  // pointer: find the sticker under the cursor from the face and texture position that was hit
  const ray = new THREE.Raycaster(), v = new THREE.Vector2();
  const faceOf = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    v.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObject(body)[0];
    if (!hit) return null;
    const k = faceOf[hit.face.materialIndex], f = faces[k];
    const x = hit.uv.x * f.c.width, y = (1 - hit.uv.y) * f.c.height;
    for (let i = f.list.length - 1; i >= 0; i--) {
      const s = f.list[i], b = s.box;
      if (!b) continue;
      // undo the sticker's tilt, then test its rectangle
      const dx = x - b.cx, dy = y - b.cy, c = Math.cos(-s.r), sn = Math.sin(-s.r);
      const lx = dx * c - dy * sn, ly = dx * sn + dy * c;
      if (Math.abs(lx) <= b.w / 2 && Math.abs(ly) <= b.h / 2) return s;
    }
    return null;
  }
  canvas.addEventListener('pointermove', e => {
    const s = pick(e);
    if (s === hot) return;
    const was = hot; hot = s;
    canvas.classList.toggle('hot', !!s);
    canvas.title = s ? s.label : '';
    if (was) paint(was.face, null);
    if (s) paint(s.face, null);
    draw();
  });
  canvas.addEventListener('pointerleave', () => { if (!hot) return; const was = hot; hot = null; canvas.classList.remove('hot'); paint(was.face, null); draw(); });
  canvas.addEventListener('click', e => { const s = pick(e); if (s) location.href = s.href; });
}

start().catch(fail);
