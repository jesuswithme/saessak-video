// 첫눈 오는 날, 빨간 목도리를 한 새싹이가 혀를 내밀고 눈송이 하나를 쫓아 몸을 흔들다
// 혀끝으로 받아먹는 8초 제자리 루프. 받아먹은 뒤엔 ^ ^ 눈, 발그레한 볼, 팔 파닥파닥, 콩콩 두 번.
// ?caption 이면 "올해 첫눈은 너랑" 자막이 위쪽 빈 하늘에 떠오른다.
// el, pen, shape, paint, limb, joint, hang, inkDefs, run, f 는 render.mjs가 앞에 붙여 주는 ink 라이브러리 함수.

const W = 480, H = 270, LOOP = 8;
const FOOT_Y = 214, HIP = FOOT_Y - 42, THIGH = 23, SHIN = 24, BX = 222;
const CATCH = 4.6; // 눈송이가 혀에 닿는 시각
const TAU = Math.PI * 2;
const SKY = '#e5e8eb', SNOW = '#fbfbfa', RED = '#c9604a', PINK = '#e48a8a', BLUSH = '#eaa3a0', GREEN = '#86a868';
const FOOT = 'M-2 -1.8 L5 -2 Q9.4 -1.4 9 1.2 Q8.6 2.6 6 2.6 L-1.6 2.6 Q-3.2 0.4 -2 -1.8Z';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ss = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
let seed = 31;
const rnd = (a = 0, b = 1) => a + (b - a) * ((seed = (seed * 16807) % 2147483647) / 2147483647);

const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '첫눈 오는 날 혀를 내밀어 눈송이를 받아먹는 새싹 머리 캐릭터' });
svg.style.setProperty('--paper', SNOW); // 하늘은 회색, 캐릭터와 눈은 흰색
const { filter } = inkDefs(svg, 'n');
document.querySelector('#stage').appendChild(svg);
const turb = svg.querySelector('feTurbulence');
svg.querySelector('feDisplacementMap').setAttribute('scale', 0.8);
const root = el('g', { filter }, svg);
// 카메라: 새싹이(발 222,214)를 화면 (165,246)에 두고 1.5배 가까이 — 혀와 눈송이가 휴대폰에서도 보이게
const scene = el('g', { transform: 'translate(165 246) scale(1.5) translate(-222 -214)' }, root);
const caption = new URLSearchParams(location.search).has('caption');

// --- 배경: 흐린 하늘, 먼 지평선, 앙상한 나무에 쌓인 눈
el('rect', { x: -10, y: -10, width: W + 20, height: H + 20, fill: SKY }, scene);
pen(scene, 0.6).setAttribute('d', 'M0 188 Q120 184 240 187 T480 186');
shape(scene, 1.1).setAttribute('d', `M366 ${FOOT_Y + 2} Q368 160 369 92 L373 92 Q374 160 376 ${FOOT_Y + 2}Z`);
pen(scene, 1).setAttribute('d', 'M370 150 Q349 132 329 124 M371 128 Q391 110 407 104 M371 108 Q357 92 347 78 M372 100 Q379 84 389 74 M339 129 Q333 118 327 112 M397 107 Q405 98 413 96');
for (const d of ['M326 123 Q331 117 339 123 Q333 125 326 123Z', 'M343 78 Q348 72 354 79 Q348 81 343 78Z', 'M399 102 Q406 96 413 101 Q406 104 399 102Z', 'M382 77 Q388 71 393 76 Q387 79 382 77Z'])
  shape(scene, 0.8).setAttribute('d', d);

// --- 내리는 눈: 뒤쪽 층 (모든 낙하 주기가 8초의 약수라 이음매가 없다)
const mkFlakes = (n, r0, r1, y0, y1) => Array.from({ length: n }, () => ({
  x0: rnd(100, 445), ph: rnd(), k: rnd() < 0.5 ? 1 : 2, m: 1 + Math.floor(rnd() * 3), sp: rnd(0, TAU), sw: rnd(3, 8),
  end: rnd(y0, y1), node: el('circle', { r: f(rnd(r0, r1)), fill: '#ffffff', stroke: 'currentColor', 'stroke-width': 0.35, 'stroke-opacity': 0.55 }, scene),
}));
const back = mkFlakes(80, 0.7, 1.5, 186, 236);

// --- 눈 덮인 땅
shape(scene, 1).setAttribute('d', `M-5 ${FOOT_Y + 1} Q60 ${FOOT_Y - 3} 120 ${FOOT_Y} T240 ${FOOT_Y} T360 ${FOOT_Y + 1} T485 ${FOOT_Y - 1} L485 275 L-5 275Z`);
pen(scene, 0.6).setAttribute('d', 'M70 228 q6 -2 12 0 M300 236 q7 -2 14 0 M160 246 q5 -2 10 0 M420 240 q6 -2 12 0');

// --- 새싹이 (뒤 → 앞)
const ch = el('g', {}, scene);
const farArm = limb(ch, 4.2), farLeg = limb(ch, 5), farFoot = el('path', { fill: 'currentColor', d: FOOT }, ch);
const scarfTail = paint(ch, RED, 1);
const body = shape(ch);
const nearLeg = limb(ch, 5), nearFoot = el('path', { fill: 'currentColor', d: FOOT }, ch);
const scarf = paint(ch, RED, 1);
const nearArm = limb(ch, 4.2);
const stem = pen(ch, 1.1);
const sprout = [paint(ch, GREEN, 1), paint(ch, GREEN, 1)];
const head = el('ellipse', { rx: 19, ry: 18, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': 1.35 }, ch);
const blush = [0, 1].map(() => el('ellipse', { rx: 2.6, ry: 1.4, fill: BLUSH }, ch));
const eyes = [0, 1].map(() => el('ellipse', { rx: 1.5, ry: 2.1, fill: 'currentColor' }, ch));
const happy = pen(ch, 1.3);
const mouth = el('ellipse', { fill: 'currentColor' }, ch);
const tongue = paint(ch, PINK, 0.6);
const smile = pen(ch, 1);
const sparkle = pen(scene, 1);

// --- 주인공 눈송이 (육각 별)
const hero = el('g', {}, scene);
el('circle', { r: 2.2, fill: '#ffffff', stroke: 'currentColor', 'stroke-width': 0.6 }, hero);
pen(hero, 0.6).setAttribute('d', [0, 60, 120].map((a) => { const r = (a * Math.PI) / 180, c = 4.2 * Math.cos(r), s = 4.2 * Math.sin(r); return `M${f(-c)} ${f(-s)} L${f(c)} ${f(s)}`; }).join(' '));

const front = mkFlakes(12, 1.6, 2.4, 240, 268);
const cap = caption ? el('text', { x: 268, 'text-anchor': 'middle', 'font-family': '"Gaegu", "Nanum Pen Script", "Malgun Gothic", sans-serif', 'font-size': 18, 'letter-spacing': 1, fill: 'currentColor' }, root) : null;
if (cap) cap.textContent = '올해 첫눈은 너랑';

// 시각 t의 새싹이 자세
function pose(t) {
  const lean = 4 * Math.sin((TAU * (t - 1.2)) / 1.7) * ss(1.3, 1.9, t) * (1 - ss(3.9, 4.5, t));     // 눈송이 따라 좌우로
  const shiver = 1.1 * Math.sin(t * 55) * ss(4.62, 4.7, t) * (1 - ss(4.85, 5.0, t));               // 차가워서 부르르
  const hop = t > 5.0 && t < 5.8 ? -3.2 * Math.abs(Math.sin((Math.PI * (t - 5.0)) / 0.4)) : 0;     // 콩콩
  const up = ss(0.2, 0.9, t) * (1 - ss(7.2, 7.8, t)) * (1 - 0.5 * ss(4.9, 5.3, t) * (1 - ss(6.6, 7.0, t))); // 하늘 보기
  const breath = 0.6 * Math.sin((TAU * t) / 4);
  const bx = BX + lean + shiver, hipY = HIP + hop, top = hipY + 3 - 30 - breath;
  const hx = bx + 1.5 - up * 1.5, hy = top - 24 - up * 0.5;
  const tg = ss(0.9, 1.3, t) * (1 - ss(4.65, 4.95, t));
  const mx = hx + 8, my = hy + 6 - up * 3;
  return { lean, hop, up, bx, hipY, top, hx, hy, tg, mx, my, tip: [mx, my + 2 + 3.5 * tg] };
}
const target = pose(CATCH).tip;
function heroAt(t) { // 1.0초에 하늘에서 나타나 팔랑팔랑 4.6초에 혀끝에 닿는다
  if (t < 1.0 || t > CATCH + 0.2) return null;
  if (t >= CATCH) { const p = pose(t); return { x: p.tip[0], y: p.tip[1] - 1, s: 1 - ss(CATCH, CATCH + 0.2, t), rot: 0 }; }
  const u = (t - 1.0) / (CATCH - 1.0), w = 1 - u;
  return { x: target[0] + w * (34 * Math.sin(TAU * 1.4 * u + 0.8) + 18), y: lerp(-8, target[1] - 1, 1 - w ** 1.25), s: 1, rot: 120 * u };
}

let sproutX = 0, sproutV = 0, tailX = 0, tailV = 0, prevHop = 0, prevLean = 0;
run((tt, dt) => {
  const t = ((tt % LOOP) + LOOP) % LOOP;
  turb.setAttribute('seed', 1 + (Math.floor(t * 5 + 1e-6) % 40));

  for (const fl of [...back, ...front]) {
    const v = (fl.ph + (fl.k * t) / LOOP) % 1;
    fl.node.setAttribute('cx', f(fl.x0 + fl.sw * Math.sin((TAU * fl.m * t) / LOOP + fl.sp)));
    fl.node.setAttribute('cy', f(-6 + v * (fl.end + 6)));
    fl.node.setAttribute('opacity', f(1 - ss(0.9, 1, v)));
  }

  const p = pose(t);
  const hipP = [p.bx, p.hipY];
  // 다리: 발은 제자리
  [[nearLeg, nearFoot, BX + 5], [farLeg, farFoot, BX - 5]].forEach(([leg, foot, ax]) => {
    const ank = [ax, FOOT_Y - 2.6];
    leg.draw([hipP, joint(hipP, ank, THIGH, SHIN, 1), ank], [0.3, 0.8]);
    foot.setAttribute('transform', `translate(${f(ank[0])} ${f(ank[1])})`);
  });
  const bot = p.hipY + 3, top = p.top, bx = p.bx;
  body.setAttribute('d', `M${f(bx - 11.5)} ${f(bot)} Q${f(bx - 14.5)} ${f(bot - 15)} ${f(bx - 9.5)} ${f(top)} Q${f(bx - 0.5)} ${f(top - 5)} ${f(bx + 8.5)} ${f(top)} Q${f(bx + 13.5)} ${f(bot - 15)} ${f(bx + 11.5)} ${f(bot)} Q${f(bx - 0.5)} ${f(bot + 1.5)} ${f(bx - 11.5)} ${f(bot)}Z`);

  // 팔: 평소엔 살짝 벌리고, 받아먹은 뒤 두 팔 번쩍
  const flap = ss(4.85, 5.1, t) * (1 - ss(6.3, 6.8, t)); // 신나서 팔 파닥
  [[nearArm, 22, 1], [farArm, -22, -1]].forEach(([arm, idle, sgn]) => {
    const sh = [bx + 1, top + 4], ang = idle + sgn * flap * (18 + 14 * Math.sin(TAU * 5 * t)) + 3 * Math.sin((TAU * t) / 4);
    const elb = hang(sh, 12.5, ang);
    arm.draw([sh, elb, hang(elb, 12, ang + 20)], [0.2, 0.5]);
  });

  // 목도리: 꼬리는 몸이 흔들릴 때 한 박자 늦게
  const dHop = (p.hop - prevHop) / Math.max(dt, 1e-3), dLean = (p.lean - prevLean) / Math.max(dt, 1e-3);
  prevHop = p.hop; prevLean = p.lean;
  tailV += (50 * (-0.8 * dLean - 0.4 * dHop - tailX) - 5 * tailV) * dt; tailX += tailV * dt;
  const tb = [bx - 7, top + 1], te = hang(tb, 15, -10 + Math.max(-25, Math.min(25, tailX)));
  scarfTail.setAttribute('d', `M${f(tb[0] - 2.6)} ${f(tb[1])} L${f(tb[0] + 2.6)} ${f(tb[1])} L${f(te[0] + 2.3)} ${f(te[1])} L${f(te[0] - 2.3)} ${f(te[1])}Z M${f(te[0] - 2.3)} ${f(te[1])} l-0.6 2.2 M${f(te[0])} ${f(te[1])} l0 2.4 M${f(te[0] + 2.3)} ${f(te[1])} l0.6 2.2`);
  scarf.setAttribute('d', `M${f(bx - 11)} ${f(top - 3)} Q${f(bx)} ${f(top + 2)} ${f(bx + 11)} ${f(top - 3)} L${f(bx + 11.5)} ${f(top + 2)} Q${f(bx)} ${f(top + 7.5)} ${f(bx - 11.5)} ${f(top + 2)}Z`);

  // 머리와 얼굴
  const { hx, hy, up, mx, my, tg } = p;
  head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy));
  const fl = heroAt(t);
  const joy = ss(4.75, 5.0, t) * (1 - ss(6.9, 7.3, t));
  const ex = hx + 8, ey = hy + 1 - up * 4;
  let lx = 0, ly = -1.2 * up;
  if (fl && t < CATCH) { const dx = fl.x - ex, dy = fl.y - ey, d = Math.hypot(dx, dy) || 1; lx = (1.6 * dx) / d; ly = (1.6 * dy) / d; }
  eyes.forEach((e, k) => { e.setAttribute('cx', f(ex + (k ? 4 : -4) + lx)); e.setAttribute('cy', f(ey + ly)); e.setAttribute('opacity', f(1 - joy)); });
  happy.setAttribute('d', [-4, 4].map((o) => `M${f(ex + o - 2.2)} ${f(ey + 0.6)} Q${f(ex + o)} ${f(ey - 2.6)} ${f(ex + o + 2.2)} ${f(ey + 0.6)}`).join(' '));
  happy.setAttribute('opacity', f(joy));
  const bl = Math.max(0.35 * ss(1.0, 1.6, t) * (1 - ss(6.9, 7.3, t)), 0.9 * joy);
  blush.forEach((b, k) => { b.setAttribute('cx', f(ex + (k ? 7.5 : -6.5))); b.setAttribute('cy', f(ey + 5)); b.setAttribute('opacity', f(bl)); });
  mouth.setAttribute('cx', f(mx)); mouth.setAttribute('cy', f(my)); mouth.setAttribute('rx', f(1.7 * tg)); mouth.setAttribute('ry', f(1.3 * tg));
  const ty = p.tip[1];
  tongue.setAttribute('d', tg > 0.02 ? `M${f(mx - 1.7)} ${f(my)} Q${f(mx - 2)} ${f(ty + 1)} ${f(mx)} ${f(ty + 1.3)} Q${f(mx + 2)} ${f(ty + 1)} ${f(mx + 1.7)} ${f(my)}Z` : '');
  smile.setAttribute('d', `M${f(mx - 2.2)} ${f(my)} Q${f(mx)} ${f(my + 2.4)} ${f(mx + 2.2)} ${f(my)}`);
  smile.setAttribute('opacity', f(joy));

  // 새싹
  sproutV += (60 * (-0.06 * dHop - 0.3 * dLean - 0.8 - sproutX) - 7 * sproutV) * dt; sproutX += sproutV * dt;
  const sway = Math.max(-7, Math.min(7, sproutX));
  const sbx = hx - 1, sby = hy - 17.6, tx = sbx + sway * 1.4, tyy = sby - 9 + Math.abs(sway) * 0.3;
  stem.setAttribute('d', `M${f(sbx)} ${f(sby)} Q${f(sbx - 1 + sway * 0.4)} ${f(sby - 5)} ${f(tx)} ${f(tyy)}`);
  sprout[0].setAttribute('d', `M${f(tx)} ${f(tyy)} Q${f(tx + 4 + sway)} ${f(tyy - 8)} ${f(tx + 11 + sway)} ${f(tyy - 4)} Q${f(tx + 6)} ${f(tyy + 1.5)} ${f(tx)} ${f(tyy)}Z`);
  sprout[1].setAttribute('d', `M${f(tx)} ${f(tyy)} Q${f(tx - 3 + sway)} ${f(tyy - 6)} ${f(tx - 8 + sway)} ${f(tyy - 3.5)} Q${f(tx - 5)} ${f(tyy + 1)} ${f(tx)} ${f(tyy)}Z`);

  // 반짝임
  const sp = ss(4.75, 4.9, t) * (1 - ss(5.8, 6.2, t));
  sparkle.setAttribute('d', sp > 0.01 ? [-150, -115, -40, -10].map((a) => {
    const r = (a * Math.PI) / 180, r0 = 24, r1 = 24 + 6 * sp;
    return `M${f(hx + r0 * Math.cos(r))} ${f(hy + r0 * Math.sin(r))} L${f(hx + r1 * Math.cos(r))} ${f(hy + r1 * Math.sin(r))}`;
  }).join(' ') : '');

  // 주인공 눈송이
  if (fl) { hero.setAttribute('opacity', f(ss(1.0, 1.2, t))); hero.setAttribute('transform', `translate(${f(fl.x)} ${f(fl.y)}) rotate(${f(fl.rot)}) scale(${f(fl.s * 1.1)})`); }
  else hero.setAttribute('opacity', 0);

  if (cap) { cap.setAttribute('opacity', f(ss(5.4, 6.0, t) * (1 - ss(7.4, 7.9, t)))); cap.setAttribute('y', f(70 - 4 * ss(5.4, 6.0, t))); }
});
