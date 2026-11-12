// 새싹이가 가로수 길을 걸으며 낙엽 더미만 골라 밟는 8초 루프.
// 처음엔 또박또박 걷다가 점점 깡총깡총 뛴다. 밟을 때마다 낙엽이 튀어 올랐다 제자리에 내려앉고 '바스락'이 뜬다.
// 화면 밖 왼쪽에서 들어와 오른쪽으로 나가므로 루프 이음매가 보이지 않는다.
// el, pen, shape, paint, limb, joint, hang, inkDefs, run, f 는 build.mjs가 앞에 붙여 주는 ink 라이브러리 함수.

const W = 480, H = 270, LOOP = 8;
const BACK = 194, FOOT_Y = 214, FRONT = 224; // 가로수 선, 발 딛는 선, 길 앞쪽 선
const HIP = FOOT_Y - 42, THIGH = 23, SHIN = 24;
const TAU = Math.PI * 2;
const COLORS = ['#e2b350', '#d9824e', '#b5643f', '#e8c46a'];
const GREEN = '#86a868';
const LEAF = 'M-4.5 0 Q-1 -3.4 4.5 0 Q-1 3.4 -4.5 0Z';
const FOOT = 'M-2 -1.8 L5 -2 Q9.4 -1.4 9 1.2 Q8.6 2.6 6 2.6 L-1.6 2.6 Q-3.2 0.4 -2 -1.8Z';
const FONT = '"Gaegu", "Nanum Pen Script", "Malgun Gothic", sans-serif';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ss = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const wrap = (x) => ((x % LOOP) + LOOP) % LOOP;
let seed = 11;
const rnd = (a = 0, b = 1) => a + (b - a) * ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const leafAt = (node, x, y, rot) => node.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
const mkLeaf = (parent, colour) => el('path', { d: LEAF, fill: colour, stroke: 'currentColor', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, parent);

const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '낙엽 더미만 골라 밟으며 깡총깡총 걸어가는 새싹 머리 캐릭터' });
const { filter } = inkDefs(svg, 'w');
document.querySelector('#stage').appendChild(svg);
const turb = svg.querySelector('feTurbulence');
svg.querySelector('feDisplacementMap').setAttribute('scale', 0.8);
const scene = el('g', { filter }, svg);

// --- 발자국 계획: 또박또박(h=0) → 깡총(h=1). 각 발이 내려앉는 시각 t와 위치 x
const steps = [{ t: -0.5, x: -60, h: 0, T: 0.5 }, { t: 0, x: -34, h: 0, T: 0.5 }];
while (steps.at(-1).x < 545) {
  const i = steps.length, h = ss(4, 10, i), T = lerp(0.5, 0.38, h), prev = steps[i - 1];
  steps.push({ t: prev.t + T, x: prev.x + lerp(26, 38, h) + rnd(-3, 3), h, T });
}
if (steps.at(-1).t > LOOP - 0.05) console.error('발자국이 루프 길이를 넘음', steps.at(-1).t);

// --- 가로수
pen(scene, 0.9).setAttribute('d', `M0 ${BACK} L${W} ${BACK}`);
for (const [cx, s, colour] of [[62, 1, COLORS[0]], [246, 1.12, COLORS[1]], [420, 0.95, COLORS[3]]]) {
  shape(scene, 1.1).setAttribute('d', `M${cx - 4} ${BACK} Q${cx - 2} ${BACK - 50} ${cx - 2.5} ${BACK - 95 * s} L${cx + 2.5} ${BACK - 95 * s} Q${cx + 2} ${BACK - 50} ${cx + 4} ${BACK}Z`);
  pen(scene, 1).setAttribute('d', `M${cx} ${BACK - 70 * s} Q${cx + 12} ${BACK - 85 * s} ${cx + 20} ${BACK - 100 * s} M${cx} ${BACK - 80 * s} Q${cx - 10} ${BACK - 92 * s} ${cx - 18} ${BACK - 104 * s}`);
  const cy = BACK - 128 * s, rx = 46 * s, ry = 36 * s, p1 = rnd(0, TAU), p2 = rnd(0, TAU);
  const pts = Array.from({ length: 60 }, (_, k) => {
    const a = (k / 60) * TAU, r = 1 + 0.07 * Math.sin(6 * a + p1) + 0.035 * Math.sin(11 * a + p2);
    return `${f(cx + rx * r * Math.cos(a))} ${f(cy + ry * r * Math.sin(a))}`;
  });
  paint(scene, colour, 1.1).setAttribute('d', `M${pts.join('L')}Z`);
  pen(scene, 0.6).setAttribute('d', Array.from({ length: 9 }, () => {
    const x = cx + rnd(-0.65, 0.65) * rx, y = cy + rnd(-0.55, 0.6) * ry;
    return `M${f(x - 2.5)} ${f(y - 1.5)} Q${f(x)} ${f(y + 1.5)} ${f(x + 2.5)} ${f(y - 1.5)}`;
  }).join(' '));
}

// --- 나무에서 떨어지는 잎 (4초 주기)
const falling = Array.from({ length: 7 }, (_, k) => {
  const [cx, s] = [[62, 1], [246, 1.12], [420, 0.95]][k % 3];
  return { x0: cx + rnd(-32, 32) * s, y0: BACK - 128 * s + rnd(8, 28), y1: rnd(198, 210), off: rnd(0, 4), ph: rnd(0, TAU), drift: rnd(-6, 6), node: mkLeaf(scene, pick(COLORS)) };
});

// --- 길: 앞쪽 선, 흩어진 낙엽, 밟을 낙엽 더미
pen(scene, 0.9).setAttribute('d', `M0 ${FRONT} L150 ${FRONT} M168 ${FRONT} L330 ${FRONT} M346 ${FRONT} L${W} ${FRONT}`);
const piles = steps.filter((s) => s.x > -20 && s.x < 500).map((s) => ({ ...s, cx: s.x + 3 }));
for (let k = 0; k < 9; k++) {
  const x = rnd(4, W - 4);
  if (piles.some((p) => Math.abs(p.cx - x) < 16)) continue;
  leafAt(mkLeaf(scene, pick(COLORS)), x, rnd(198, 206), rnd(-60, 60));
}
for (const p of piles) {
  p.leaves = Array.from({ length: 6 }, (_, k) => {
    const pops = k < 5;
    return {
      dx: rnd(-7, 7), dy: rnd(-3.2, -0.4), r0: rnd(-45, 45), pops,
      Hgt: lerp(10, 26, p.h) * rnd(0.7, 1.2), D: lerp(0.9, 1.4, p.h) * rnd(0.85, 1.15), delay: rnd(0, 0.06),
      A: rnd(3, 8) * (rnd() < 0.5 ? -1 : 1), drift: rnd(2, 10), spin: rnd(-1, 1) * 220,
      node: mkLeaf(scene, pick(COLORS)),
    };
  });
}

// --- 캐릭터 (뒤에서 앞 순서)
const ch = el('g', {}, scene);
const mkFoot = () => el('path', { fill: 'currentColor', d: FOOT }, ch);
const farArm = limb(ch, 4.2), farLeg = limb(ch, 5), farFoot = mkFoot();
const body = shape(ch);
const nearLeg = limb(ch, 5), nearFoot = mkFoot();
const nearArm = limb(ch, 4.2);
const stem = pen(ch, 1.1);
const sprout = [paint(ch, GREEN, 1), paint(ch, GREEN, 1)];
const head = el('ellipse', { rx: 19, ry: 18, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': 1.35 }, ch);
const eyes = [0, 1].map(() => el('ellipse', { rx: 1.5, fill: 'currentColor' }, ch));
const smile = pen(ch, 1.3); // 신나면 ^ ^ 눈

// --- 바스락 글씨 (밟을 때마다)
const sounds = piles.map((p) => ({ p, x: p.cx + rnd(-3, 3), rot: rnd(-12, 8), node: el('text', { 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 700, 'font-size': lerp(8, 11, p.h), fill: 'currentColor' }, scene) }));
sounds.forEach((s) => (s.node.textContent = s.p.h > 0.5 ? '바스락!' : '바스락'));

// 발 하나(q=0 앞발, 1 뒷발)의 위치: 디딘 자리에 붙어 있다가 들려서 두 칸 앞 자리로 옮겨 간다
function footAt(q, i, t) {
  const j = i % 2 === q ? i : i - 1;
  const lo = steps[j].t + steps[j + 1].T * lerp(1.15, 0.48, steps[j + 1].h);
  if (t < lo || j + 2 >= steps.length) return { x: steps[j].x, lift: 0, pitch: 0 };
  const e = clamp01((t - lo) / (steps[j + 2].t - lo)), arc = Math.sin(Math.PI * e);
  return { x: lerp(steps[j].x, steps[j + 2].x, ss(0, 1, e)), lift: lerp(5, 10, steps[j + 2].h) * arc, pitch: 20 * (1 - e) * arc - 18 * e * arc };
}

let sproutX = 0, sproutV = 0, prevBob = 0;
run((tt, dt) => {
  const t = wrap(tt);
  turb.setAttribute('seed', 1 + (Math.floor(t * 5 + 1e-6) % 40)); // 초당 5번 손그림 떨림

  // 나무에서 떨어지는 잎: 3.2초 동안 흔들리며 내려와 잠깐 머물다 사라진다
  for (const l of falling) {
    const v = (t + l.off) % 4, u = clamp01(v / 3.2);
    const x = l.x0 + 8 * Math.sin((TAU * v) / 1.4 + l.ph) * (1 - u * 0.6) + l.drift * u;
    leafAt(l.node, x, lerp(l.y0, l.y1, u), 40 * Math.sin((TAU * v) / 1.4 + l.ph) * (1 - u));
    l.node.setAttribute('opacity', f(ss(0, 0.3, v) * (1 - ss(3.5, 3.95, v))));
  }

  // 낙엽 더미: 밟힌 순간 튀어 올라 팔랑이며 제자리로 내려앉는다
  for (const p of piles) for (const l of p.leaves) {
    const tau = wrap(t - p.t - l.delay);
    if (!l.pops || tau >= l.D) { leafAt(l.node, p.cx + l.dx, FOOT_Y + l.dy, l.r0); continue; }
    const u = tau / l.D, env = Math.sin(Math.PI * u);
    const up = u < 0.22 ? Math.sin((Math.PI / 2) * (u / 0.22)) : 1 - ss(0.22, 1, u);
    leafAt(l.node, p.cx + l.dx + (l.A * Math.sin(TAU * 1.5 * u) + l.drift) * env, FOOT_Y + l.dy - l.Hgt * up, l.r0 + l.spin * env);
  }
  for (const s of sounds) {
    const tau = wrap(t - s.p.t);
    const show = tau < 0.6;
    s.node.setAttribute('opacity', show ? f(1 - ss(0.35, 0.6, tau)) : 0);
    if (show) s.node.setAttribute('transform', `translate(${f(s.x)} ${f(FRONT + 15 - 5 * tau)}) rotate(${f(s.rot)}) scale(${f(0.6 + 0.4 * ss(0, 0.1, tau))})`);
  }

  // 캐릭터: 지금 어느 발자국 사이에 있는지
  let i = 1;
  while (i + 1 < steps.length && steps[i + 1].t <= t) i++;
  if (i + 1 >= steps.length) { ch.setAttribute('display', 'none'); return; }
  ch.removeAttribute('display');
  const a = steps[i], b = steps[i + 1], s = (t - a.t) / b.T, h = b.h;
  const bx = lerp((steps[i - 1].x + a.x) / 2, (a.x + b.x) / 2, s);
  const walkBob = -1.6 * Math.sin(Math.PI * s);
  const hopBob = 2.2 * Math.sin(Math.PI * clamp01(s / 0.35)) - 11 * Math.sin(Math.PI * clamp01((s - 0.4) / 0.6));
  const bob = lerp(walkBob, hopBob, h);
  const hip = [bx, HIP + bob];

  // 다리와 발
  const legs = [[nearLeg, nearFoot], [farLeg, farFoot]];
  const feet = [0, 1].map((q) => footAt(q, i, t));
  feet.forEach((ft, q) => {
    const ank = [ft.x, FOOT_Y - 2.6 - ft.lift];
    const knee = joint(hip, ank, THIGH, SHIN, 1);
    legs[q][0].draw([hip, knee, ank], [0.3, 0.8]);
    legs[q][1].setAttribute('transform', `translate(${f(ank[0])} ${f(ank[1])}) rotate(${f(ft.pitch)})`);
  });

  // 몸통과 팔: 다리와 반대로 흔들고, 신날수록 크게
  const bot = hip[1] + 3, top = bot - 30;
  body.setAttribute('d', `M${f(bx - 11.5)} ${f(bot)} Q${f(bx - 14.5)} ${f(bot - 15)} ${f(bx - 9.5)} ${f(top)} Q${f(bx - 0.5)} ${f(top - 5)} ${f(bx + 8.5)} ${f(top)} Q${f(bx + 13.5)} ${f(bot - 15)} ${f(bx + 11.5)} ${f(bot)} Q${f(bx - 0.5)} ${f(bot + 1.5)} ${f(bx - 11.5)} ${f(bot)}Z`);
  const d = Math.max(-1, Math.min(1, (feet[0].x - bx) / 17));
  const amp = lerp(34, 62, h);
  [[nearArm, -d], [farArm, d]].forEach(([arm, k]) => {
    const sh = [bx + 1, top + 4], ang = k * amp;
    const elb = hang(sh, 12.5, ang);
    arm.draw([sh, elb, hang(elb, 12, ang + lerp(20, 45, h))], [0.2, 0.5]);
  });

  // 머리: 발밑 낙엽을 내려다보고, 신나면 ^ ^ 눈
  const hx = bx + 1.5, hy = top - 24;
  head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy));
  const joy = ss(0.45, 0.75, h);
  const blink = Math.max(0, 1 - Math.abs(t - 1.4) / 0.09);
  eyes.forEach((e, k) => {
    e.setAttribute('cx', f(hx + 8 + (k ? 4 : -4))); e.setAttribute('cy', f(hy + 3));
    e.setAttribute('ry', f(2.1 * (1 - blink) + 0.35)); e.setAttribute('opacity', f(1 - joy));
  });
  smile.setAttribute('d', [-4, 4].map((o) => `M${f(hx + 8 + o - 2.2)} ${f(hy + 3.6)} Q${f(hx + 8 + o)} ${f(hy + 0.4)} ${f(hx + 8 + o + 2.2)} ${f(hy + 3.6)}`).join(' '));
  smile.setAttribute('opacity', f(joy));

  // 새싹: 몸이 오르내릴 때 한 박자 늦게 휘청인다
  const vy = (bob - prevBob) / Math.max(dt, 1e-3); prevBob = bob;
  sproutV += (60 * (-0.06 * vy - 0.8 - sproutX) - 7 * sproutV) * dt; sproutX += sproutV * dt;
  const sway = Math.max(-6, Math.min(6, sproutX));
  const sbx = hx - 1, sby = hy - 17.6, tx = sbx + sway * 1.4, ty = sby - 9 + Math.abs(sway) * 0.3;
  stem.setAttribute('d', `M${f(sbx)} ${f(sby)} Q${f(sbx - 1 + sway * 0.4)} ${f(sby - 5)} ${f(tx)} ${f(ty)}`);
  sprout[0].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx + 4 + sway)} ${f(ty - 8)} ${f(tx + 11 + sway)} ${f(ty - 4)} Q${f(tx + 6)} ${f(ty + 1.5)} ${f(tx)} ${f(ty)}Z`);
  sprout[1].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx - 3 + sway)} ${f(ty - 6)} ${f(tx - 8 + sway)} ${f(ty - 3.5)} Q${f(tx - 5)} ${f(ty + 1)} ${f(tx)} ${f(ty)}Z`);
});
