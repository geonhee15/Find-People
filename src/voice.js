// 동물의 숲 스타일 옹알이 목소리 + 타자 애니메이션
// 한글 음절을 초성/중성으로 분해해서, 중성(모음)의 포먼트로 톱니파를 걸러 짧은 "음절 소리"를 만든다.
let ac = null, master = null;
let muted = false;
try { muted = localStorage.getItem('findpeople.mute') === '1'; } catch (e) { /* 저장소 없음 */ }

export function audio() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.5;
    const comp = ac.createDynamicsCompressor();
    master.connect(comp).connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
export function masterOut() { audio(); return master; }
export const isMuted = () => muted;
export function setMuted(v) { muted = v; try { localStorage.setItem('findpeople.mute', v ? '1' : '0'); } catch (e) { /* 무시 */ } }

// 모음 포먼트 (F1, F2)
const FORM = { a: [800, 1250], e: [480, 1900], i: [300, 2300], o: [480, 880], u: [340, 820], eu: [360, 1400], eo: [600, 1050] };
const JUNG = ['a', 'e', 'a', 'e', 'eo', 'e', 'eo', 'e', 'o', 'a', 'e', 'e', 'o', 'u', 'eo', 'e', 'i', 'u', 'eu', 'i', 'i'];
const FRIC = new Set([9, 10, 12, 13, 14, 18]); // ㅅㅆㅈㅉㅊㅎ
const STOP = new Set([0, 1, 3, 4, 7, 8, 15, 16, 17]); // ㄱㄲㄷㄸㅂㅃㅋㅌㅍ
const LATIN_V = { a: 'a', e: 'e', i: 'i', o: 'o', u: 'u', y: 'i' };

function analyze(ch) {
  const c = ch.charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) {
    const idx = c - 0xac00, cho = Math.floor(idx / 588), jung = Math.floor((idx % 588) / 28);
    return { v: JUNG[jung], fric: FRIC.has(cho), stop: STOP.has(cho), cho };
  }
  const l = ch.toLowerCase();
  if (/[a-z]/.test(l)) return { v: LATIN_V[l] || 'eo', fric: 'szfhcx'.includes(l), stop: 'kgtdpb'.includes(l), cho: l.charCodeAt(0) % 19 };
  if (/[0-9]/.test(l)) return { v: 'a', fric: false, stop: true, cho: +l };
  return null;
}

let noiseBuf = null;
function noise() {
  const a = audio();
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const n = a.createBufferSource(); n.buffer = noiseBuf;
  return n;
}

// 한 음절
function syllable(info, v, t0) {
  const a = audio();
  const dur = 0.07 / (v.speed || 1);
  const pitch = v.pitch * (1 + (Math.random() - 0.5) * v.vari) * (1 + (info.cho % 5) * 0.015);
  const out = a.createGain(); out.gain.value = 1;
  let dest = master;
  if (v.radio) {
    const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 450;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    out.connect(hp).connect(lp).connect(master);
    dest = null;
  }
  if (dest) out.connect(dest);
  const osc = a.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(pitch * 1.1, t0);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, t0 + dur);
  const [f1, f2] = FORM[info.v];
  const fm = v.formant || 1;
  const b1 = a.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = f1 * fm; b1.Q.value = 5;
  const b2 = a.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = f2 * fm; b2.Q.value = 7;
  const g = a.createGain();
  const vol = 0.9;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + (info.stop ? 0.004 : 0.012));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const g2 = a.createGain(); g2.gain.value = 0.55;
  osc.connect(b1).connect(g); osc.connect(b2).connect(g2).connect(g);
  g.connect(out);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
  if (info.fric) {
    const n = noise(); const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
    const ng = a.createGain(); ng.gain.setValueAtTime(0.25, t0); ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
    n.connect(hp).connect(ng).connect(out); n.start(t0); n.stop(t0 + 0.035);
  }
}
// 무전 잡음
export function staticBurst(dur = 0.35) {
  if (muted) return;
  const a = audio(), t = a.currentTime;
  const n = noise(); const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6;
  const g = a.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(bp).connect(g).connect(master); n.start(t); n.stop(t + dur);
}

// 화자 목소리: look 또는 이름 해시에서 음높이를 정함
export function voiceFor(look, seed = 0) {
  const base = look?.female ? 230 : 135;
  const age = look?.age || 35;
  const p = base * (1 - Math.max(0, age - 40) * 0.004) * (0.88 + ((seed % 97) / 97) * 0.26);
  return { pitch: p, vari: 0.3, formant: look?.female ? 1.12 : 0.96, speed: 1 };
}

// 타자 애니메이션 + 음성. 클릭하면 끝까지 스킵.
export function speak(el, text, voice, opts = {}) {
  const id = (el._speakId = (el._speakId || 0) + 1);
  let i = 0;
  const parts = [];
  // [잡음] 토큰은 한 덩어리로
  for (let k = 0; k < text.length;) {
    if (text.startsWith('[잡음]', k)) { parts.push('[잡음]'); k += 4; } else { parts.push(text[k]); k++; }
  }
  let shown = '';
  el.textContent = '';
  el.classList.add('speaking');
  const finish = () => { el._speakId++; el.textContent = text; el.classList.remove('speaking'); el.onclick = null; opts.onDone?.(); };
  el.onclick = finish;
  const step = () => {
    if (el._speakId !== id) return;
    if (i >= parts.length) { el.classList.remove('speaking'); el.onclick = null; opts.onDone?.(); return; }
    const ch = parts[i++];
    shown += ch; el.textContent = shown;
    let delay = 28;
    if (ch === '[잡음]') { staticBurst(0.35); delay = 380; }
    else {
      const info = analyze(ch);
      if (info) { if (!muted) syllable(info, voice, audio().currentTime + 0.005); delay = 62 / (voice.speed || 1); }
      else if ('.!?…'.includes(ch)) delay = 200;
      else if (',~'.includes(ch)) delay = 120;
    }
    setTimeout(step, delay);
  };
  step();
}
