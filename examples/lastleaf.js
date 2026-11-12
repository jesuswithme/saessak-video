// 「새싹이의 늦가을」 1편 — 마지막 잎. 세로형(9:16, viewBox 270×480) 10초 제자리 루프.
// 흰 눈썹의 나이 든 새싹이가 앙상한 나무 아래 벤치에 앉아 가지 끝에 하나 남은 잎을 올려다본다.
// 바람이 두 번 불고(두 번째는 세게) 잎이 파르르 떨지만 끝내 버티자, 새싹이가 작게 미소 짓고 천천히 끄덕인다.
// ?caption 이면 "아직 붙어 있는 것도, 용기겠지" 자막. ?mark=@계정 이면 맨 아래에 워터마크.
// el, pen, shape, paint, limb, joint, hang, inkDefs, run, f 는 render.mjs가 앞에 붙여 주는 ink 라이브러리 함수.

const W = 270, H = 480, LOOP = 10;
const GROUND = 390, SEAT = 364, CX = 100;      // 땅, 벤치 상판, 새싹이 엉덩이 x
const TIP = [150, 176];                          // 마지막 잎이 매달린 가지 끝
const TAU = Math.PI * 2;
const GREEN = '#86a868', LEAFC = '#d9824e', BLUSH = '#eaa3a0';
const FALLEN = ['#e2b350', '#b5643f', '#e8c46a', '#d9824e'];
const LEAF = 'M-4.5 0 Q-1 -3.4 4.5 0 Q-1 3.4 -4.5 0Z';
const FOOT = 'M-2 -1.8 L5 -2 Q9.4 -1.4 9 1.2 Q8.6 2.6 6 2.6 L-1.6 2.6 Q-3.2 0.4 -2 -1.8Z';
const FONT = '"Gaegu", "Nanum Pen Script", "Malgun Gothic", sans-serif';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ss = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const bump = (a, b, x) => Math.sin(Math.PI * clamp01((x - a) / (b - a)));

const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '앙상한 나무 아래 벤치에 앉아 마지막 잎을 올려다보는 나이 든 새싹 머리 캐릭터' });
const { filter } = inkDefs(svg, 'l');
document.querySelector('#stage').appendChild(svg);
const turb = svg.querySelector('feTurbulence');
svg.querySelector('feDisplacementMap').setAttribute('scale', 0.8);
const root = el('g', { filter }, svg);
// 카메라: 벤치와 마지막 잎 쪽으로 1.4배 — 땅(390)이 화면 380에, 아래 100px은 자막·워터마크 자리
const scene = el('g', { transform: 'translate(-53 -166) scale(1.4)' }, root);
const params = new URLSearchParams(location.search);
const caption = params.has('caption'), markText = params.get('mark');
const mkLeaf = (parent, colour, s = 1) => { const g = el('g', {}, parent); el('path', { d: LEAF, fill: colour, stroke: 'currentColor', 'stroke-width': 0.8 / s, 'stroke-linejoin': 'round', transform: `scale(${s})` }, g); return g; };

// 바람 세기: 잔바람 + 2.0초 약한 바람 + 3.5초 센 바람 (끝에서 처음 값으로 돌아온다)
const wind = (t) => 0.12 + 0.45 * bump(1.8, 3.1, t) ** 2 + 1.0 * bump(3.3, 5.6, t) ** 1.5;

// --- 나무: 줄기와 가지 (마지막 잎 달린 가지는 바람에 흔들려 매 프레임 다시 그린다)
const TX = 214;
shape(scene, 1.1).setAttribute('d', `M${TX - 7} ${GROUND + 1} Q${TX - 4} 300 ${TX - 2} 200 Q${TX - 1} 150 ${TX - 1.5} 100 L${TX + 1.5} 100 Q${TX + 2} 150 ${TX + 3} 200 Q${TX + 5} 300 ${TX + 8} ${GROUND + 1}Z`);
pen(scene, 1).setAttribute('d', [
  `M${TX} 168 Q${TX + 22} 140 ${TX + 40} 118`, `M${TX + 24} 139 Q${TX + 34} 136 ${TX + 44} 140`,
  `M${TX} 132 Q${TX - 20} 108 ${TX - 34} 86`, `M${TX - 22} 108 Q${TX - 32} 106 ${TX - 40} 110`,
  `M${TX} 118 Q${TX + 16} 94 ${TX + 26} 74`, `M${TX} 102 Q${TX - 3} 84 ${TX + 2} 66`,
  `M${TX + 1} 245 Q${TX + 18} 232 ${TX + 34} 228`, `M${TX - 22} 108 Q${TX - 26} 96 ${TX - 24} 88`,
].join(' '));
const branch = pen(scene, 1.1), twig = pen(scene, 0.9);

// --- 땅, 풀, 떨어진 잎들
pen(scene, 1).setAttribute('d', `M0 ${GROUND} L${W} ${GROUND}`);
pen(scene, 0.6).setAttribute('d', 'M22 398 q4 -1.5 8 0 M180 404 q5 -2 10 0 M244 397 q4 -1.5 8 0');
[[30, 386, 30, 0], [176, 387, -20, 1], [238, 386, 60, 2], [196, 388, 110, 3], [52, 388, -70, 1]].forEach(([x, y, r, c]) =>
  mkLeaf(scene, FALLEN[c], 1.3).setAttribute('transform', `translate(${x} ${y}) rotate(${r})`));

// --- 벤치 (등받이 → 지팡이 → 새싹이 → 상판 앞 다리)
shape(scene, 1).setAttribute('d', `M70 330 L74 330 L74 ${GROUND} L70 ${GROUND}Z M146 330 L150 330 L150 ${GROUND} L146 ${GROUND}Z`);
shape(scene, 1).setAttribute('d', 'M64 327 L156 327 L156 334 L64 334Z M64 340 L156 340 L156 347 L64 347Z');
pen(scene, 1.6).setAttribute('d', `M163 ${GROUND} L156 338 Q154 330 160 329 Q165 329 165 334`);   // 벤치에 기대 둔 지팡이
shape(scene, 1).setAttribute('d', `M78 368 L82 368 L82 ${GROUND} L78 ${GROUND}Z M138 368 L142 368 L142 ${GROUND} L138 ${GROUND}Z`);
shape(scene, 1.1).setAttribute('d', `M60 ${SEAT - 1} Q110 ${SEAT - 2} 160 ${SEAT - 1} L160 ${SEAT + 5} Q110 ${SEAT + 6} 60 ${SEAT + 5}Z`);

// --- 나이 든 새싹이 (앉은 자세, 먼 팔은 그리지 않는다)
const farLeg = limb(scene, 5), farFoot = el('path', { fill: 'currentColor', d: FOOT }, scene);
const body = shape(scene);
const nearLeg = limb(scene, 5), nearFoot = el('path', { fill: 'currentColor', d: FOOT }, scene);
const nearArm = limb(scene, 4.2);
const stem = pen(scene, 1.1);
const sprout = [paint(scene, GREEN, 1), paint(scene, GREEN, 1)];
const head = el('ellipse', { rx: 19, ry: 18, fill: '#fdfdfc', stroke: 'currentColor', 'stroke-width': 1.35 }, scene);
const blush = [0, 1].map(() => el('ellipse', { rx: 2.6, ry: 1.4, fill: BLUSH }, scene));
const eyes = [0, 1].map(() => el('ellipse', { rx: 1.5, fill: 'currentColor' }, scene));
const brows = [0, 1].map(() => shape(scene, 0.9));
const smile = pen(scene, 1);

// --- 마지막 잎과 바람에 날려 가는 잎 두 장
const last = mkLeaf(scene, LEAFC, 1.75);
const flyers = [{ y0: 250, y1: 214, d: 0, c: FALLEN[0] }, { y0: 300, y1: 282, d: 0.35, c: FALLEN[1] }].map((o) => ({ ...o, node: mkLeaf(scene, o.c, 1.4) }));

// --- 자막(장면 안, 떨림 같이)과 워터마크(떨림 없이 또렷하게)
const cap = caption ? el('text', { x: W / 2, y: 428, 'text-anchor': 'middle', 'font-family': FONT, 'font-size': 15, 'letter-spacing': 0.5, fill: 'currentColor' }, root) : null;
if (cap) cap.textContent = '아직 붙어 있는 것도, 용기겠지';
const mark = markText && el('text', { x: W / 2, y: 466, 'text-anchor': 'middle', 'font-family': '"Segoe UI", "Malgun Gothic", sans-serif', 'font-size': 8.5, 'letter-spacing': 0.6, fill: 'currentColor', opacity: 0.5 }, svg);
if (mark) mark.textContent = markText;

let sx = 0, sv = 0, py = 0;
run((tt, dt) => {
  const t = ((tt % LOOP) + LOOP) % LOOP;
  turb.setAttribute('seed', 1 + (Math.floor(t * 5 + 1e-6) % (LOOP * 5)));
  const w = wind(t);

  // 가지 끝: 바람에 왼쪽으로 밀리며 떨린다 (진동 주기는 모두 10초의 약수)
  const jit = Math.sin((TAU * 31 * t) / LOOP), slow = Math.sin((TAU * 4 * t) / LOOP);
  const tip = [TIP[0] - 5 * w + 1.2 * w * jit, TIP[1] + 2.5 * w + 0.8 * slow];
  branch.setAttribute('d', `M${TX - 1} 196 Q${f(TX - 30)} ${f(178 + w)} ${f((TX - 1 + tip[0]) / 2 - 8)} ${f(176 + w * 1.5)} Q${f(tip[0] + 14)} ${f(tip[1] - 2)} ${f(tip[0])} ${f(tip[1])}`);
  twig.setAttribute('d', `M${TX - 40} 182 Q${TX - 46} 168 ${TX - 44} 158`);

  // 마지막 잎: 꼭지에서 매달려 흔들리고, 센 바람엔 파르르 떨며 거의 뒤집힌다
  const flutter = Math.sin((TAU * 47 * t) / LOOP) * (8 + 45 * w * w), sway = 14 * Math.sin((TAU * 5 * t) / LOOP + 1);
  const rot = 70 + 70 * w + sway * (1 - 0.5 * w) + flutter * 0.7;
  last.setAttribute('transform', `translate(${f(tip[0])} ${f(tip[1])}) rotate(${f(rot)}) translate(7.9 0)`);

  // 날려 가는 잎: 센 바람 동안 오른쪽에서 왼쪽으로 빙글빙글
  for (const fl of flyers) {
    const u = clamp01((t - 3.5 - fl.d) / 1.9);
    if (u <= 0 || u >= 1) { fl.node.setAttribute('opacity', 0); continue; }
    fl.node.setAttribute('opacity', 1);
    fl.node.setAttribute('transform', `translate(${f(lerp(W + 15, -20, u))} ${f(lerp(fl.y0, fl.y1, u) + 10 * Math.sin(TAU * 1.5 * u))}) rotate(${f(-720 * u)})`);
  }

  // 표정·자세 시간표
  const worry = ss(3.4, 3.8, t) * (1 - ss(5.2, 5.7, t)) + 0.4 * bump(1.9, 3.0, t);  // 걱정: 눈썹 올라가고 몸을 앞으로
  const relief = ss(5.9, 6.5, t) * (1 - ss(8.9, 9.6, t));                           // 안도: 미소, 볼, 눈 가늘게
  const nod = 2.4 * bump(6.7, 7.5, t);
  const breath = 0.5 - 0.5 * Math.cos((TAU * t) / 5);
  const lean = 2.2 * worry;
  const up = 1 - 0.35 * bump(6.7, 7.5, t);

  // 다리 (발은 땅에)
  const hipN = [CX + 1, SEAT - 1], hipF = [CX - 1, SEAT - 2];
  const kneeN = [CX + 23, SEAT - 0.5], kneeF = [CX + 20, SEAT - 1];
  const ankN = hang(kneeN, 24, 5), ankF = hang(kneeF, 24, 3);
  farLeg.draw([hipF, kneeF, ankF], [0.3, 0.8]); farFoot.setAttribute('transform', `translate(${f(ankF[0])} ${f(GROUND - 2.6)})`);
  nearLeg.draw([hipN, kneeN, ankN], [0.3, 0.8]); nearFoot.setAttribute('transform', `translate(${f(ankN[0])} ${f(GROUND - 2.6)})`);

  // 몸통 (살짝 구부정, 걱정되면 앞으로)
  const bot = SEAT + 1, top = bot - 29 - breath * 1.1, bx = CX;
  body.setAttribute('d', `M${f(bx - 11.5)} ${f(bot)} Q${f(bx - 14.5)} ${f(bot - 15)} ${f(bx - 9 + lean)} ${f(top)} Q${f(bx + lean)} ${f(top - 5)} ${f(bx + 9 + lean)} ${f(top)} Q${f(bx + 13.5)} ${f(bot - 15)} ${f(bx + 11.5)} ${f(bot)} Q${f(bx)} ${f(bot + 1.5)} ${f(bx - 11.5)} ${f(bot)}Z`);
  // 팔: 손은 무릎 위, 걱정되면 무릎을 꼭
  const sh = [bx + 1.5 + lean, top + 4];
  const elb = hang(sh, 12.5, 14 + 6 * worry);
  nearArm.draw([sh, elb, hang(elb, 12, 72 - 8 * worry)], [0.2, 0.5]);

  // 머리: 잎을 올려다보고(뒤로 살짝 젖힘), 끄덕일 땐 숙인다
  const hx = bx + 2.5 + lean * 1.2 - 1.6 * up + nod * 0.5, hy = top - 24 + 1.5 + nod - 0.5 * up;
  head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy));
  const ex = hx + 8, ey = hy + 3 - 5.2 * up;
  const lx = 1.2 * up - 0.4 * worry, ly = -2.0 * up;
  const blink = Math.max(bump(1.2, 1.35, t), bump(8.3, 8.45, t));
  const squint = 0.55 * relief;                          // 웃을 때 눈이 가늘어진다
  eyes.forEach((e, k) => {
    e.setAttribute('cx', f(ex + (k ? 4 : -4) + lx)); e.setAttribute('cy', f(ey + ly));
    e.setAttribute('ry', f((2.1 + 0.4 * worry) * (1 - Math.max(blink, squint)) + 0.35));
  });
  brows.forEach((b, k) => { // 흰 눈썹: 걱정되면 안쪽이 올라간다
    const x = ex + (k ? 4 : -4) + lx * 0.5, y = ey - 4.4 + ly * 0.5 - 1.4 * worry, tilt = (k ? -1 : 1) * 0.9 * worry;
    b.setAttribute('d', `M${f(x - 3.4)} ${f(y + 1 + tilt)} Q${f(x - 3)} ${f(y - 2 + tilt)} ${f(x)} ${f(y - 1.6)} Q${f(x + 3.2)} ${f(y - 2.2 - tilt)} ${f(x + 3.8)} ${f(y + 0.4 - tilt)} Q${f(x + 1.5)} ${f(y - 0.2)} ${f(x)} ${f(y + 0.6)} Q${f(x - 2)} ${f(y - 0.2 + tilt)} ${f(x - 3.4)} ${f(y + 1 + tilt)}Z`);
  });
  blush.forEach((b, k) => { b.setAttribute('cx', f(ex + (k ? 7.5 : -6.5))); b.setAttribute('cy', f(ey + 5.5)); b.setAttribute('opacity', f(0.7 * relief)); });
  const mx = ex + 0.8, my = ey + 7.2;
  smile.setAttribute('d', `M${f(mx - 2.4)} ${f(my - 0.6)} Q${f(mx)} ${f(my + 1.9 * relief)} ${f(mx + 2.4)} ${f(my - 0.6)}`);
  smile.setAttribute('opacity', f(0.25 + 0.75 * relief));

  // 새싹: 바람에 왼쪽으로 눕고, 머리가 오르내리면 한 박자 늦게
  const vy = (hy - py) / Math.max(dt, 1e-3); py = hy;
  sv += (60 * (-0.06 * vy - 0.8 - 5 * (w - 0.12) - sx) - 7 * sv) * dt; sx += sv * dt;
  const s = Math.max(-7, Math.min(7, sx)) + 1.2 * w * jit;
  const sbx = hx - 1, sby = hy - 17.6, tx = sbx + s * 1.4, ty = sby - 9 + Math.abs(s) * 0.3;
  stem.setAttribute('d', `M${f(sbx)} ${f(sby)} Q${f(sbx - 1 + s * 0.4)} ${f(sby - 5)} ${f(tx)} ${f(ty)}`);
  sprout[0].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx + 4 + s)} ${f(ty - 8)} ${f(tx + 11 + s)} ${f(ty - 4)} Q${f(tx + 6)} ${f(ty + 1.5)} ${f(tx)} ${f(ty)}Z`);
  sprout[1].setAttribute('d', `M${f(tx)} ${f(ty)} Q${f(tx - 3 + s)} ${f(ty - 6)} ${f(tx - 8 + s)} ${f(ty - 3.5)} Q${f(tx - 5)} ${f(ty + 1)} ${f(tx)} ${f(ty)}Z`);

  if (cap) { const c = ss(6.3, 6.9, t) * (1 - ss(9.3, 9.85, t)); cap.setAttribute('opacity', f(c)); cap.setAttribute('y', f(430 - 4 * ss(6.3, 6.9, t))); }
});
