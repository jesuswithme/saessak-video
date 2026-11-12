// 새싹이 장면 파일(.js) 하나를 HTML로 묶고, 프레임을 캡처해 MP4(+BGM, +반복 버전)로 만든다.
//
//   node render.mjs <scene.js> [--seconds 10] [--name 이름] [--out 폴더]
//                   [--query "caption&scene=rain"] [--music spec.json] [--loop 30] [--bg #f7f0e1]
//
// 결과(출력 폴더): 이름.html, 이름.mp4, 이름_30s.mp4, (음악이 있으면) 이름_bgm.wav
// 확인용 모음 이미지: <임시폴더>/saessak-frames/이름/sheet.png (경로를 마지막에 출력한다)
// 필요: Node ≥ 22.18, ffmpeg, Chrome 또는 Edge (CHROME 환경변수로 지정 가능)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { spawnSync } from 'node:child_process';
import { join, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const scenePath = argv[0] && !argv[0].startsWith('--') ? resolve(argv[0]) : null;
if (!scenePath || !existsSync(scenePath)) { console.error('사용법: node render.mjs <scene.js> [--seconds 10] [--name 이름] [--out 폴더] [--query "caption"] [--music spec.json]'); process.exit(1); }

const seconds = Number(opt('seconds', 6)), fps = 30, frames = Math.round(seconds * fps);
const name = opt('name', basename(scenePath, '.js'));
const outDir = resolve(opt('out', process.cwd()));
const query = opt('query', '');
const music = opt('music');
const loopTarget = Number(opt('loop', 30));
const bg = opt('bg', '#f7f0e1');
mkdirSync(outDir, { recursive: true });

const run = (cmd, args, env) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`실패: ${cmd} ${args.slice(0, 3).join(' ')} …`); process.exit(r.status || 1); }
};

// 1) HTML 한 파일로 묶기 (더블클릭으로도 열린다)
const ink = stripTypeScriptTypes(readFileSync(join(ROOT, 'lib/ink.ts'), 'utf8')).replace(/^export /gm, '');
const html = join(outDir, `${name}.html`);
writeFileSync(html, `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}</title>
<style>
  html, body { margin: 0; height: 100%; background: ${bg}; overflow: hidden; }
  #stage, #stage svg { display: block; width: 100vw; height: 100vh; }
  #stage svg { --paper: ${bg}; }
  #stage svg .pp { fill: var(--paper); }
</style>
</head>
<body>
<div id="stage"></div>
<script type="module">
${ink}
${readFileSync(scenePath, 'utf8')}
</script>
</body>
</html>
`);

// 2) 프레임 캡처
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
if (!CHROME) { console.error('Chrome/Edge를 찾지 못했습니다. CHROME 환경변수로 경로를 지정하세요.'); process.exit(1); }
const frameDir = join(tmpdir(), 'saessak-frames', name);
rmSync(frameDir, { recursive: true, force: true });
const url = `${pathToFileURL(html).href}?debug${query ? `&${query}` : ''}`;
run(process.execPath, [join(ROOT, 'scripts/capture.ts'), url, frameDir, String(frames), String(fps), '1920', '1080'], { CHROME });

// 3) 음악 (선택)
let wav = null;
if (music) {
  wav = join(outDir, `${name}_bgm.wav`);
  run(process.execPath, [join(ROOT, 'scripts/music.mjs'), resolve(music), wav, String(seconds)]);
}

// 4) 인코딩
const mp4 = join(outDir, `${name}.mp4`);
const enc = ['-y', '-v', 'error', '-framerate', String(fps), '-i', join(frameDir, 'f%04d.png')];
if (wav) enc.push('-i', wav);
enc.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-tune', 'animation');
if (wav) enc.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
enc.push('-movflags', '+faststart', mp4);
run('ffmpeg', enc);

const reps = Math.ceil(loopTarget / seconds);
let looped = null;
if (reps > 1) {
  looped = join(outDir, `${name}_${Math.round(reps * seconds)}s.mp4`);
  run('ffmpeg', ['-y', '-v', 'error', '-stream_loop', String(reps - 1), '-i', mp4, '-c', 'copy', looped]);
}

// 5) 확인용 모음 이미지 (16칸)
const sheet = join(frameDir, 'sheet.png');
run('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', join(frameDir, 'f%04d.png'), '-vf', `select='not(mod(n\\,${Math.max(1, Math.floor(frames / 16))}))',scale=480:-1,tile=4x4`, '-frames:v', '1', sheet]);

console.log('\n완료');
for (const [k, v] of [['HTML', html], ['영상', mp4], ['반복 영상', looped], ['BGM', wav], ['프레임', frameDir], ['확인용 모음', sheet]]) if (v) console.log(`  ${k}: ${v}`);
