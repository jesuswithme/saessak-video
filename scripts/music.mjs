// 장면 길이에 딱 맞는 반복 BGM을 코드로 합성한다 (저작권 걱정 없음).
//   node music.mjs <spec.json> <out.wav> [seconds]
//
// spec.json 예 (examples/autumn.music.json):
// {
//   "bpm": 96,                                   // 4박 × 마디 수 × 60/bpm 이 영상 길이와 같아야 이음매가 없다
//   "chords": [{ "bass": 41, "arp": [53,57,60,64] }, ...],   // MIDI 번호, 마디마다 하나(모자라면 반복)
//   "melody": [[[0,76,1],[1,77,1],[2,81,2]], ...],          // 마디별 [박, 음, 길이(박)], 오르골 소리
//   "whoosh": [1.0, 2.7],      // 바람 '휘잉' (왼→오른쪽으로 지나감)
//   "chime":  [6.4],           // '띵' (뭔가 내려앉거나 깨닫는 순간)
//   "rustle": [0.5, 1.0],      // '바스락' (낙엽 밟는 발걸음)
//   "drops":  true,            // 빗방울 톡톡 (비 장면)
//   "volume": { "arp": 1, "bass": 1, "melody": 1, "whoosh": 1, "chime": 1, "rustle": 1, "drops": 1 }
// }
// 모든 소리 꼬리를 끝에서 처음으로 이어 더하므로 반복 재생해도 끊기지 않는다.
import { readFileSync, writeFileSync } from 'node:fs';

const [specPath, out, secArg] = process.argv.slice(2);
if (!specPath || !out) { console.error('사용법: node music.mjs <spec.json> <out.wav> [seconds]'); process.exit(1); }
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const LEN = Number(secArg || spec.seconds || 10), SR = 44100, N = Math.round(SR * LEN);
const BEAT = 60 / (spec.bpm || 96), BAR = BEAT * 4, BARS = Math.round(LEN / BAR);
if (Math.abs(BARS * BAR - LEN) > 0.02) console.warn(`경고: ${spec.bpm} BPM 4/4 ${BARS}마디는 ${(BARS * BAR).toFixed(2)}초라 ${LEN}초 영상과 어긋납니다. bpm = ${(240 * Math.max(1, BARS) / LEN).toFixed(2)} 를 쓰면 딱 맞습니다.`);
const vol = { arp: 1, bass: 1, melody: 1, whoosh: 1, chime: 1, rustle: 1, drops: 1, ...(spec.volume || {}) };

const L = new Float32Array(N), R = new Float32Array(N);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 5;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const panGain = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
const add = (t0, k, v, pan) => { const i = ((Math.floor(t0 * SR) + k) % N + N) % N, [gl, gr] = panGain(pan); L[i] += v * gl; R[i] += v * gr; };

function note(t0, midi, dur, v0, partials, pan = 0) {
  const f0 = hz(midi), n = Math.floor(dur * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    let v = 0;
    for (const [ratio, amp, decay] of partials) v += amp * Math.sin(2 * Math.PI * f0 * ratio * t) * Math.exp(-t * decay);
    add(t0, k, v * v0 * Math.min(1, t / 0.006), pan);
  }
}
const PIANO = [[1, 1, 2.2], [2, 0.45, 3.5], [3, 0.18, 5], [4, 0.08, 7]];
const BASS = [[1, 1, 1.2], [2, 0.3, 2.5]];
const MUSICBOX = [[1, 1, 2.8], [2.76, 0.35, 7], [5.4, 0.12, 12]];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];

const chords = spec.chords || [], melody = spec.melody || [];
for (let b = 0; b < BARS; b++) {
  const t = b * BAR, c = chords[b % Math.max(1, chords.length)];
  if (c) {
    note(t, c.bass, 3, 0.2 * vol.bass, BASS);
    note(t + 2 * BEAT, c.bass + 12, 2, 0.08 * vol.bass, BASS);
    ARP.forEach((k, e) => note(t + (e * BEAT) / 2, c.arp[k % c.arp.length], 2, 0.075 * vol.arp * (e % 2 ? 0.8 : 1), PIANO, k % 2 ? 0.35 : -0.35));
  }
  for (const [beat, m, len] of melody[b % Math.max(1, melody.length)] || []) note(t + beat * BEAT, m, Math.max(1.6, len * BEAT * 2), 0.1 * vol.melody, MUSICBOX, 0.1);
}

for (const g of spec.whoosh || []) { // 저역 통과 잡음이 부풀었다 사라진다
  let lp = 0, lp2 = 0;
  const n = Math.floor(1.8 * SR);
  for (let k = 0; k < n; k++) {
    const u = k / n, env = Math.sin(Math.PI * u) ** 2, cut = 0.008 + 0.03 * env;
    lp += cut * (rnd() * 2 - 1 - lp); lp2 += cut * (lp - lp2);
    add(g, k, lp2 * env * 1.6 * vol.whoosh, -0.8 + 1.6 * u);
  }
}
for (const c of spec.chime || []) { note(c, 93, 2.5, 0.07 * vol.chime, MUSICBOX, 0.3); note(c + 0.08, 100, 2.5, 0.045 * vol.chime, MUSICBOX, 0.3); }
for (const r of spec.rustle || []) { // 짧고 거친 잡음 알갱이 여러 개 = 바스락
  const pan = rnd() * 0.6 - 0.3;
  for (let g = 0; g < 9; g++) {
    const at = r + rnd() * 0.14, n = Math.floor((0.004 + rnd() * 0.01) * SR), amp = (0.5 + rnd() * 0.5) * 0.22 * vol.rustle;
    let prev = 0;
    for (let k = 0; k < n; k++) { const x = rnd() * 2 - 1, hp = x - prev; prev = x; add(at, k, hp * amp * Math.exp((-k / n) * 4), pan); }
  }
}
if (spec.drops) for (let d = 0; d < LEN * 9; d++) { // 빗방울: 아주 짧은 높은 '톡'
  const at = rnd() * LEN, f = 1800 + rnd() * 2200, n = Math.floor(0.03 * SR), amp = (0.3 + rnd() * 0.7) * 0.05 * vol.drops, pan = rnd() * 1.6 - 0.8;
  for (let k = 0; k < n; k++) add(at, k, Math.sin((2 * Math.PI * f * k) / SR * (1 - k / n * 0.3)) * Math.exp((-k / n) * 6) * amp, pan);
}

// 잔향 (원형으로 더한다)
const dryL = L.slice(), dryR = R.slice();
for (const [sec, g] of [[0.029, 0.22], [0.043, 0.18], [0.067, 0.14], [0.11, 0.1], [0.17, 0.07], [0.31, 0.05]]) {
  const d = Math.floor(sec * SR);
  for (let i = 0; i < N; i++) { L[(i + d) % N] += dryR[i] * g; R[(i + d + 37) % N] += dryL[i] * g; }
}

let peak = 1e-9;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = 0.8 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), 46 + i * 4);
}
writeFileSync(out, buf);
console.log(`BGM 생성: ${out} (${LEN}초)`);
