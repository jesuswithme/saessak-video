// 새싹이가 낙엽 지는 거리를 천천히 걷는 10초 루프.
// 바람이 불 때마다 머리 위 새싹 잎이 초록 → 노랑 → 빨강으로 물들고, 새싹이는 모른 채 걷는다.
// 마지막에 나무에서 떨어진 잎 하나가 머리 위에 살포시 내려앉고, 그대로 화면 밖으로 걸어 나간다.
// el, pen, shape, paint, limb, joint, hang, inkDefs, run, f 는 build.mjs가 앞에 붙여 주는 ink 라이브러리 함수.

const W = 480, H = 270, LOOP = 10;
const BACK = 194, FOOT_Y = 214, FRONT = 224;
const HIP = FOOT_Y - 42, THIGH = 23, SHIN = 24;
const TAU = Math.PI * 2;
const COLORS = ['#e2b350', '#d9824e', '#b5643f', '#e8c46a'];
const GUSTS = [1.0, 2.7, 4.4];          // 바람이 부는 시각
const LAND = 6.4;                       // 잎이 머리에 내려앉는 시각 (나무 사이 빈 하늘 아래)
const SPROUT_A = ['#86a868', '#b7b35c', '#e2b350', '#d9824e'];
const SPROUT_B = ['#86a868', '#c4ac55', '#d9824e', '#c9604a'];
const LEAF = 'M-4.5 0 Q-1 -3.4 4.5 0 Q-1 3.4 -4.5 0Z';
const FOOT = 'M-2 -1.8 L5 -2 Q9.4 -1.4 9 1.2 Q8.6 2.6 6 2.6 L-1.6 2.6 Q-3.2 0.4 -2 -1.8Z';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ss = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
let seed = 23;
const rnd = (a = 0, b = 1) => a + (b - a) * ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const leafAt = (node, x, y, rot, s = 1) => node.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
const mkLeaf = (parent, colour) => el('path', { d: LEAF, fill: colour, stroke: 'currentColor', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, parent);
const hex = (c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
const mix = (list, x) => { // x: 0..len-1 사이를 부드럽게 섞는다
  const k = Math.min(list.length - 2, Math.floor(x)), u = x - k, a = hex(list[k]), b = hex(list[k + 1]);
  return `rgb(${a.map((v, j) => Math.round(lerp(v, b[j], u))).join(',')})`;
};
const gust = (t) => GUSTS.reduce((s, g) => s + ss(g, g + 0.4, t) * (1 - ss(g + 0.8, g + 1.6, t)), 0); // 0..1 바람 세기
const tint = (t) => GUSTS.reduce((s, g) => s + ss(g + 0.2, g + 1.1, t), 0);                          // 0..3 물든 정도

const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '바람이 불 때마다 머리 위 새싹이 물들고, 마지막에 낙엽 하나가 머리에 내려앉는 새싹 머리 캐릭터' });
const { filter } = inkDefs(svg, 'a');
document.querySelector('#stage').appendChild(svg);
const turb = svg.querySelector('feTurbulence');
svg.querySelector('feDisplacementMap').setAttribute('scale', 0.8);
const scene = el('g', { filter }, svg);

// --- 발자국 계획: 일정한 보폭으로 천천히
const steps = [{ t: -0.48, x: -46 }, { t: 0, x: -20 }];
while (steps.at(-1).x < 530) steps.push({ t: steps.at(-1).t + 0.48, x: steps.at(-1).x + 28 });
if (steps.at(-1).t > LOOP - 0.05) console.error('발자국이 루프 길이를 넘음', steps.at(-1).t);

// 몸통 위치와 높이 (걷는 동안만, 다 지나가면 null)
function bodyAt(t) {
  let i = 1;
  while (i + 1 < steps.length && steps[i + 1].t <= t) i++;
  if (i + 1 >= steps.length) return null;
  const a = steps[i], b = steps[i + 1], s = (t - a.t) / (b.t - a.t);
  const bx = lerp((steps[i - 1].x + a.x) / 2, (a.x + b.x) / 2, s), bob = -1.6 * Math.sin(Math.PI * s);
  const top = HIP + bob + 3 - 30;
  return { i, bx, bob, top, hx: bx + 1.5, hy: top - 24 };
}

// --- 가로수
pen(scene, 0.9).setAttribute('d', `M0 ${BACK} L${W} ${BACK}`);
const TREES = [[62, 1, COLORS[0]], [246, 1.12, COLORS[1]], [420, 0.95, COLORS[3]]];
for (const [cx, s, colour] of TREES) {
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

// --- 나무에서 떨어지는 잎 (5초 주기, 바람이 불면 옆으로 날린다)
const falling = Array.from({ length: 8 }, (_, k) => {
  const [cx, s] = TREES[k % 3];
  return { x0: cx + rnd(-32, 32) * s, y0: BACK - 128 * s + rnd(8, 28), y1: rnd(198, 210), off: rnd(0, 5), ph: rnd(0, TAU), drift: rnd(-6, 6), node: mkLeaf(scene, pick(COLORS)) };
});

// --- 길과 흩어진 낙엽
pen(scene, 0.9).setAttribute('d', `M0 ${FRONT} L150 ${FRONT} M168 ${FRONT} L330 ${FRONT} M346 ${FRONT} L${W} ${FRONT}`);
for (let k = 0; k < 24; k++) leafAt(mkLeaf(scene, pick(COLORS)), rnd(4, W - 4), rnd(198, 222), rnd(-60, 60));

// --- 캐릭터 (뒤에서 앞 순서)
const ch = el('g', {}, scene);
const mkFoot = () => el('path', { fill: 'currentColor', d: FOOT }, ch);
const farArm = limb(ch, 4.2), farLeg = limb(ch, 5), farFoot = mkFoot();
const body = shape(ch);
const nearLeg = limb(ch, 5), nearFoot = mkFoot();
const nearArm = limb(ch, 4.2);
const stem = pen(ch, 1.1);
const sprout = [paint(ch, SPROUT_A[0], 1), paint(ch, SPROUT_B[0], 1)];
const head = el('ellipse', { rx: 19, ry: 18, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': 1.35 }, ch);
const eyes = [0, 1].map(() => el('ellipse', { rx: 1.5, fill: 'currentColor' }, ch));

// --- 머리에 내려앉을 잎 하나와 바람 선
const hero = mkLeaf(scene, '#d9824e');

// --- 자막 (주소에 ?caption 이 있을 때만): 잎이 내려앉은 뒤 길 아래 빈 곳에 떠오른다
const caption = new URLSearchParams(location.search).has('caption')
  ? el('text', { x: W / 2, 'text-anchor': 'middle', 'font-family': '"Gaegu", "Nanum Pen Script", "Malgun Gothic", sans-serif', 'font-size': 14, 'letter-spacing': 0.6, fill: 'currentColor' }, scene)
  : null;
if (caption) caption.textContent = '나도 모르는 사이에 가을이 묻었네';
const LEAF_OFF = [8.5, -16.8], LEAF_ROT = 28;
const winds = GUSTS.flatMap((g) => [0, 1, 2].map((k) => ({ g: g + k * 0.18, y: [92, 128, 160][k] + rnd(-6, 6), len: rnd(34, 50), node: pen(scene, 0.9) })));

function footAt(q, i, t) {
  const j = i % 2 === q ? i : i - 1;
  const lo = steps[j].t + 0.48 * 1.15;
  if (t < lo || j + 2 >= steps.length) return { x: steps[j].x, lift: 0, pitch: 0 };
  const e = clamp01((t - lo) / (steps[j + 2].t - lo)), arc = Math.sin(Math.PI * e);
  return { x: lerp(steps[j].x, steps[j + 2].x, ss(0, 1, e)), lift: 5 * arc, pitch: 20 * (1 - e) * arc - 18 * e * arc };
}

const landPose = bodyAt(LAND);
const target = [landPose.hx + LEAF_OFF[0], landPose.hy + LEAF_OFF[1]];
let sproutX = 0, sproutV = 0, prevBob = 0;
run((tt, dt) => {
  const t = ((tt % LOOP) + LOOP) % LOOP;
  turb.setAttribute('seed', 1 + (Math.floor(t * 5 + 1e-6) % 50));
  const w = gust(t);

  if (caption) {
    caption.setAttribute('opacity', f(ss(6.9, 7.5, t) * (1 - ss(9.3, 9.8, t))));
    caption.setAttribute('y', f(252 - 3 * ss(6.9, 7.5, t)));
  }

  for (const l of falling) {
    const v = (t + l.off) % 5, u = clamp01(v / 4);
    const x = l.x0 + 8 * Math.sin((TAU * v) / 1.4 + l.ph) * (1 - u * 0.6) + l.drift * u + 22 * w * (1 - u);
    leafAt(l.node, x, lerp(l.y0, l.y1, u), 40 * Math.sin((TAU * v) / 1.4 + l.ph) * (1 - u) + 60 * w);
    l.node.setAttribute('opacity', f(ss(0, 0.3, v) * (1 - ss(4.5, 4.95, v))));
  }

  // 바람 선: 왼쪽에서 오른쪽으로 휙 지나간다
  for (const s of winds) {
    const u = (t - s.g) / 1.3;
    if (u < 0 || u > 1) { s.node.setAttribute('d', ''); continue; }
    const x = lerp(-60, 520, u), y = s.y + 3 * Math.sin(u * 7);
    s.node.setAttribute('d', `M${f(x)} ${f(y)} q${f(s.len / 4)} -5 ${f(s.len / 2)} 0 t${f(s.len / 2)} 0 q8 -1 6 -7 q-3 -3 -6 0`);
    s.node.setAttribute('opacity', f(0.75 * Math.sin(Math.PI * u)));
  }

  // 내려앉는 잎: 나무에서 2.8초 동안 팔랑이며 내려와 머리에 앉고, 이후엔 머리를 따라간다
  const p = bodyAt(t);
  const fallT = clamp01((t - (LAND - 2.8)) / 2.8);
  if (t < LAND - 2.8) hero.setAttribute('opacity', 0);
  else if (t < LAND) {
    const u = fallT, sway = 1 - u;
    const x = lerp(target[0] - 50, target[0], ss(0, 1, u)) + 12 * Math.sin(TAU * 1.2 * u) * sway;
    const y = lerp(target[1] - 34, target[1], 1 - (1 - u) ** 1.7);
    hero.setAttribute('opacity', f(ss(0, 0.06, u)));
    leafAt(hero, x, y, LEAF_ROT + 55 * Math.sin(TAU * 1.2 * u + 0.6) * sway, 1.35);
  } else if (p) {
    hero.setAttribute('opacity', 1);
    const k = t - LAND; // 앉은 직후 살짝 흔들리다 멈춘다
    leafAt(hero, p.hx + LEAF_OFF[0], p.hy + LEAF_OFF[1], LEAF_ROT + 12 * Math.exp(-k * 4) * Math.sin(k * 16), 1.35);
  } else hero.setAttribute('opacity', 0);

  if (!p) { ch.setAttribute('display', 'none'); return; }
  ch.removeAttribute('display');
  const { i, bx, bob, top, hx, hy } = p;
  const hip = [bx, HIP + bob];

  const legs = [[nearLeg, nearFoot], [farLeg, farFoot]];
  const feet = [0, 1].map((q) => footAt(q, i, t));
  feet.forEach((ft, q) => {
    const ank = [ft.x, FOOT_Y - 2.6 - ft.lift];
    legs[q][0].draw([hip, joint(hip, ank, THIGH, SHIN, 1), ank], [0.3, 0.8]);
    legs[q][1].setAttribute('transform', `translate(${f(ank[0])} ${f(ank[1])}) rotate(${f(ft.pitch)})`);
  });

  const bot = hip[1] + 3;
  body.setAttribute('d', `M${f(bx - 11.5)} ${f(bot)} Q${f(bx - 14.5)} ${f(bot - 15)} ${f(bx - 9.5)} ${f(top)} Q${f(bx - 0.5)} ${f(top - 5)} ${f(bx + 8.5)} ${f(top)} Q${f(bx + 13.5)} ${f(bot - 15)} ${f(bx + 11.5)} ${f(bot)} Q${f(bx - 0.5)} ${f(bot + 1.5)} ${f(bx - 11.5)} ${f(bot)}Z`);
  const d = Math.max(-1, Math.min(1, (feet[0].x - bx) / 14));
  [[nearArm, -d], [farArm, d]].forEach(([arm, k]) => {
    const sh = [bx + 1, top + 4], ang = k * 30;
    const elb = hang(sh, 12.5, ang);
    arm.draw([sh, elb, hang(elb, 12, ang + 20)], [0.2, 0.5]);
  });

  // 머리: 앞을 보며 걷는다, 가끔 깜빡
  head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy));
  const blink = Math.max(0, 1 - Math.abs(t - 2.7) / 0.09, 1 - Math.abs(t - 8.4) / 0.09);
  eyes.forEach((e, k) => {
    e.setAttribute('cx', f(hx + 8 + (k ? 4 : -4))); e.setAttribute('cy', f(hy + 1));
    e.setAttribute('ry', f(2.1 * (1 - blink) + 0.35));
  });

  // 새싹: 바람에 오른쪽으로 크게 휘고, 바람이 지날 때마다 한 단계씩 물든다
  const vy = (bob - prevBob) / Math.max(dt, 1e-3); prevBob = bob;
  sproutV += (60 * (-0.06 * vy - 0.8 + 6 * w + 1.2 * w * Math.sin(t * 18) - sproutX) - 7 * sproutV) * dt; sproutX += sproutV * dt;
  const sway = Math.max(-7, Math.min(7, sproutX));
  const c = tint(t);
  sprout[0].setAttribute('fill', mix(SPROUT_A, c)); sprout[1].setAttribute('fill', mix(SPROUT_B, c));
  const sbx = hx - 1, sby = hy - 17.6, tx = sbx + sway * 1.4, ty = sby - 9 + Math.abs(sway) * 0.3;
  stem.setAttribute('d', `M${f(sbx)} ${f(sby)} Q${f(sbx - 1 + sway * 0.4)} ${f(sby - 5)} ${f(tx)} ${f(ty)}`);
  sprout[0].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx + 4 + sway)} ${f(ty - 8)} ${f(tx + 11 + sway)} ${f(ty - 4)} Q${f(tx + 6)} ${f(ty + 1.5)} ${f(tx)} ${f(ty)}Z`);
  sprout[1].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx - 3 + sway)} ${f(ty - 6)} ${f(tx - 8 + sway)} ${f(ty - 3.5)} Q${f(tx - 5)} ${f(ty + 1)} ${f(tx)} ${f(ty)}Z`);
});
