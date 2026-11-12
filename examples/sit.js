// 새싹 머리 캐릭터가 작은 가판대 앞 스툴에 앉아 손님을 기다리며 발을 동동거리는 6초 루프.
// 모든 움직임은 t의 주기 함수(6초의 약수)라서 영상이 이음매 없이 반복된다.
// el, pen, shape, paint, limb, hang, curve, inkDefs, run, f 는 build.mjs가 앞에 붙여 주는 ink 라이브러리 함수.

const W = 480, H = 270, GROUND = 204, LOOP = 6;
const GREEN = '#86a868', RED = '#c9604a';
const TAU = Math.PI * 2;
const ss = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '스툴에 앉아 발을 동동거리며 손님을 기다리는 새싹 머리 캐릭터' });
const { filter } = inkDefs(svg, 's');
document.querySelector('#stage').appendChild(svg);
const turb = svg.querySelector('feTurbulence');
svg.querySelector('feDisplacementMap').setAttribute('scale', 0.8);
const scene = el('g', { filter, transform: 'translate(-24 8)' }, svg);

// --- 비 오는 장면(index.html?scene=rain): 빗줄기, 튀는 물, 웅덩이 물결은 맨 뒤에 그린다
const RAIN = new URLSearchParams(location.search).get('scene') === 'rain';
let drops = [], ripples = [];
if (RAIN) {
  document.body.style.background = '#edf0ea';
  svg.style.setProperty('--paper', '#edf0ea');
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const layer = el('g', { color: '#6f8ea6' }, scene);
  drops = Array.from({ length: 54 }, (_, i) => {
    const x = 30 + (i + rnd()) * (470 / 54);
    // 잎 우산 위, 가판대 위, 그 밖에는 바닥에 떨어진다
    const limit = x > 170 && x < 260 ? 54 + 20 * ((x - 215) / 45) ** 2 : x >= 260 && x < 352 ? 147 : GROUND;
    return { x, limit, off: rnd(), line: pen(layer, 0.8), splash: pen(layer, 0.7) };
  });
  ripples = [0, 0.5].map((off) => ({ off, node: pen(layer, 0.7) }));
}

// --- 바닥과 풀
pen(scene, 0.8).setAttribute('d', `M150 ${GROUND} L178 ${GROUND} M224 ${GROUND} L256 ${GROUND} M276 ${GROUND} L334 ${GROUND} M352 ${GROUND} L380 ${GROUND}`);
const tufts = [[166, 0], [232, 1.3], [356, 2.4], [372, 3.6]].map(([x, ph]) => ({ x, ph, node: pen(scene, 0.8) }));

// --- 가판대: 상판, 다리, 현수막, 컵, 쿠키
shape(scene, 1).setAttribute('d', `M266 153 L264 ${GROUND} L268 ${GROUND} L270 153Z M340 153 L342 ${GROUND} L346 ${GROUND} L344 153Z`);
shape(scene, 1.1).setAttribute('d', 'M258 148 Q305 147.2 352 148 L352 153 Q305 153.8 258 153Z');
shape(scene, 1).setAttribute('d', 'M286 153 L326 153 L326.5 172 L306 168.5 L285.5 172Z');
el('text', { x: 306, y: 164.6, 'text-anchor': 'middle', 'font-size': 8.5, 'font-family': '"Segoe Print", "Comic Sans MS", cursive', 'font-weight': 700, fill: 'currentColor' }, scene).textContent = 'OPEN';
pen(scene, 1).setAttribute('d', 'M305.5 139.5 q5 0.5 4 4 q-1 3 -4.5 2.5');
paint(scene, RED, 1.1).setAttribute('d', 'M292 148 L293 137 Q299 136.2 305 137 L306 148Z');
pen(scene, 1).setAttribute('d', 'M317 147.6 L341 147.6');
[145.4, 142.2, 139].forEach((y, i) => el('ellipse', { cx: 329 + (i - 1) * 0.8, cy: y, rx: 7, ry: 2, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': 1 }, scene));
const steam = [0, 0.5].map((off, i) => ({ off, x: 296.5 + i * 5, node: pen(scene, 0.8) }));

// --- 스툴
shape(scene, 1).setAttribute('d', `M186 162 L182 ${GROUND} L186 ${GROUND} L190 162Z M210 162 L214 ${GROUND} L218 ${GROUND} L214 162Z`);
pen(scene, 0.8).setAttribute('d', 'M185.6 186 L214.4 186');
shape(scene, 1.1).setAttribute('d', 'M180 158 Q180 155 184 155 L216 155 Q220 155 220 158 L220 160.5 Q220 163 217 163 L183 163 Q180 163 180 160.5Z');

// --- 캐릭터 (뒤에서 앞 순서)
const FOOT = 'M-2 -1.8 L5 -2 Q9.4 -1.4 9 1.2 Q8.6 2.6 6 2.6 L-1.6 2.6 Q-3.2 0.4 -2 -1.8Z';
const foot = (node, a, deg) => node.setAttribute('transform', `translate(${f(a[0])} ${f(a[1])}) rotate(${f(deg)})`);
const farLeg = limb(scene, 5), farShoe = el('path', { fill: 'currentColor', d: FOOT }, scene);
const body = shape(scene);
const nearLeg = limb(scene, 5), nearShoe = el('path', { fill: 'currentColor', d: FOOT }, scene);
const brolly = RAIN ? el('g', {}, scene) : null; // 커다란 잎 우산
if (brolly) {
  pen(brolly, 1.3).setAttribute('d', 'M222 137 Q220 100 215 62');
  paint(brolly, GREEN, 1.2).setAttribute('d', 'M168 72 Q188 44 215 47 Q244 45 262 70 Q238 61 215 64 Q192 61 168 72Z');
  pen(brolly, 0.7).setAttribute('d', 'M177 65 Q196 53 215 55 Q236 53 253 63');
}
const nearArm = limb(scene, 4.2);
const stem = pen(scene, 1.1);
const leaves = [paint(scene, GREEN, 1), paint(scene, GREEN, 1)];
const head = el('ellipse', { rx: 19, ry: 18, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': 1.35 }, scene);
const eyes = [el('ellipse', { rx: 1.5, fill: 'currentColor' }, scene), el('ellipse', { rx: 1.5, fill: 'currentColor' }, scene)];

// 다리 흔들기: 1.2초 주기(6초에 5번). 뒤로 살짝, 앞으로 크게.
const swing = curve([[0, -16], [0.32, 4], [0.6, 30], [0.92, 10]], 1.2);

run((t) => {
  const u = ((t % LOOP) + LOOP) % LOOP;
  turb.setAttribute('seed', 1 + (Math.floor(u * 5 + 1e-6) % 30)); // 초당 5번 선이 살짝 떨리는 손그림 느낌

  // 2.7~4.6초: 왼쪽(길 쪽)을 돌아보는 동안 발 동동이 잦아든다
  // 비 오는 장면: 왼쪽 대신 하늘을 올려다보고(up), 다리는 느리고 작게 흔든다(k, amp)
  const glance = ss(2.7, 3.1, u) - ss(4.2, 4.6, u);
  const look = RAIN ? 0.9 : 0.9 - 1.8 * glance;
  const up = RAIN ? glance : 0;
  const k = RAIN ? 0.6 : 1;
  const amp = RAIN ? 0.55 : 1 - 0.8 * (ss(2.5, 3.0, u) - ss(4.4, 5.0, u));
  const breath = 0.5 - 0.5 * Math.cos((TAU * u) / 3);
  const bob = 0.5 * amp * Math.sin((TAU * u * k) / 0.6);
  const blink = Math.max(0, 1 - Math.abs(u - 1.3) / 0.09, 1 - Math.abs(u - 5.2) / 0.09);

  // 다리
  const ang = (ph) => 7 + (swing(u * k + ph) - 7) * amp;
  const aN = ang(0), aF = ang(0.6);
  const kneeF = [222, 154], kneeN = [220, 157.5];
  const ankF = hang(kneeF, 24, aF), ankN = hang(kneeN, 24, aN);
  farLeg.draw([[199, 153.5], kneeF, ankF], [0.3, 0.8]); foot(farShoe, ankF, -aF * 0.8);
  nearLeg.draw([[197, 156.5], kneeN, ankN], [0.3, 0.8]); foot(nearShoe, ankN, -aN * 0.8);

  // 몸통과 팔 (숨 쉴 때 어깨가 조금 올라간다)
  const sy = 127 - breath * 1.2;
  body.setAttribute('d', `M188 156 Q185 141 190 ${f(sy)} Q199 ${f(sy - 5)} 208 ${f(sy)} Q213 141 211 156 Q199 157.5 188 156Z`);
  nearArm.draw(RAIN ? [[205, sy + 4], [216, 143], [222, 130]] : [[205, sy + 4], [209, 145], [214, 153]], [0.2, 0.5]);
  if (brolly) brolly.setAttribute('transform', `rotate(${f(1.5 * Math.sin((TAU * u) / 3))} 222 134)`);

  // 머리, 눈, 새싹
  const hx = 200 + look * 1.5, hy = 103 - breath * 1.2 + bob - up;
  head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy));
  eyes.forEach((e, i) => {
    e.setAttribute('cx', f(hx + look * 9 + (i ? 4 : -4)));
    e.setAttribute('cy', f(hy + 2 - up * 9));
    e.setAttribute('ry', f(2.1 * (1 - blink) + 0.35));
  });
  const sway = 1.6 * Math.sin((TAU * u) / 3 + 1) + 0.7 * amp * Math.sin((TAU * u) / 0.6 + 0.8) - look * 0.8;
  const bx = hx - 1, by = hy - 17.6, tx = bx + sway * 1.4, ty = by - 9;
  stem.setAttribute('d', `M${f(bx)} ${f(by)} Q${f(bx - 1 + sway * 0.4)} ${f(by - 5)} ${f(tx)} ${f(ty)}`);
  leaves[0].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx + 4 + sway)} ${f(ty - 8)} ${f(tx + 11 + sway)} ${f(ty - 4)} Q${f(tx + 6)} ${f(ty + 1.5)} ${f(tx)} ${f(ty)}Z`);
  leaves[1].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx - 3 + sway)} ${f(ty - 6)} ${f(tx - 8 + sway)} ${f(ty - 3.5)} Q${f(tx - 5)} ${f(ty + 1)} ${f(tx)} ${f(ty)}Z`);

  // 컵에서 피어오르는 김 (3초 주기)
  for (const s of steam) {
    const v = (u / 3 + s.off) % 1, y = 134 - v * 16, w = 2.2 * Math.sin(TAU * v + s.off * 4);
    s.node.setAttribute('d', `M${f(s.x)} ${f(y)} q${f(3 + w * 0.5)} -3.5 0 -7 q${f(-3 - w * 0.5)} -3.5 0 -7`);
    s.node.setAttribute('opacity', f(0.75 * Math.sin(Math.PI * v)));
  }

  // 비: 0.75초마다 떨어지는 빗줄기, 닿는 순간 튀는 물, 웅덩이 물결
  for (const d of drops) {
    const y = -30 + ((u / 0.75 + d.off) % 1) * 315, q = (y - d.limit) / 40, r = 2 + 3 * q;
    d.line.setAttribute('d', y < d.limit ? `M${f(d.x)} ${f(y)} l-1.4 -9` : '');
    d.splash.setAttribute('d', q > 0 && q < 1 ? `M${f(d.x - 1.5)} ${f(d.limit - 0.5)} l${f(-r)} ${f(-r)} M${f(d.x + 1.5)} ${f(d.limit - 0.5)} l${f(r)} ${f(-r)}` : '');
    d.splash.setAttribute('opacity', f(Math.max(0, 1 - q)));
  }
  for (const p of ripples) {
    const v = (u / 1.5 + p.off) % 1, r = 3 + 10 * v;
    p.node.setAttribute('d', `M${f(240 - r)} 213 a${f(r)} ${f(r * 0.28)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r * 0.28)} 0 1 0 ${f(-2 * r)} 0`);
    p.node.setAttribute('opacity', f(1 - v));
  }

  // 풀
  for (const g of tufts) {
    const l = 1.3 * Math.sin((TAU * u) / 3 + g.ph);
    g.node.setAttribute('d', [[-3, 5], [0, 8], [3.2, 6]].map(([dx, h]) => `M${g.x + dx} ${GROUND} Q${f(g.x + dx + l * 0.3)} ${GROUND - h * 0.5} ${f(g.x + dx * 1.5 + l)} ${GROUND - h}`).join(' '));
  }
});
