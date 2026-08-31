import type {
  AnalyzedBeat,
  BeatEnvelopePoint,
  BeatSoundType,
} from '@/types/breakdown';

export interface AudioBeatAnalysis {
  beats: AnalyzedBeat[];
  envelope: BeatEnvelopePoint[];
  bpm: number;
}

const FFT_SIZE = 2048;
const HOP = 512;
const MIN_ONSET_GAP_SEC = 0.048;
const MERGE_SAME_HIT_SEC = 0.042;
const CLUSTER_SIM = 0.82;

function mixMono(buffer: AudioBuffer): Float32Array {
  const { numberOfChannels, length } = buffer;
  const out = new Float32Array(length);
  for (let c = 0; c < numberOfChannels; c++) {
    const ch = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) out[i] += ch[i];
  }
  if (numberOfChannels > 1) {
    const inv = 1 / numberOfChannels;
    for (let i = 0; i < length; i++) out[i] *= inv;
  }
  return out;
}

function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

function fftRadix2(real: Float64Array, imag: Float64Array) {
  const n = real.length;
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;
      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = (2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; i + k < i + half; k++) {
        const ang = step * k;
        const wr = Math.cos(ang);
        const wi = -Math.sin(ang);
        const ur = real[i + k];
        const ui = imag[i + k];
        const vr = wr * real[i + k + half] - wi * imag[i + k + half];
        const vi = wr * imag[i + k + half] + wi * real[i + k + half];
        real[i + k] = ur + vr;
        imag[i + k] = ui + vi;
        real[i + k + half] = ur - vr;
        imag[i + k + half] = ui - vi;
      }
    }
  }
}

function bandEnergy(mag: Float64Array, sampleRate: number, lo: number, hi: number): number {
  const binHz = sampleRate / FFT_SIZE;
  const a = Math.max(1, Math.floor(lo / binHz));
  const b = Math.min(mag.length - 1, Math.ceil(hi / binHz));
  let sum = 0;
  for (let i = a; i <= b; i++) sum += mag[i];
  return sum;
}

function logBands(mag: Float64Array, sampleRate: number, count = 12): number[] {
  const nyquist = sampleRate / 2;
  const bands = new Array<number>(count).fill(0);
  for (let i = 0; i < count; i++) {
    const lo = 30 * Math.pow(nyquist / 30, i / count);
    const hi = 30 * Math.pow(nyquist / 30, (i + 1) / count);
    bands[i] = bandEnergy(mag, sampleRate, lo, hi);
  }
  const norm = Math.sqrt(bands.reduce((s, v) => s + v * v, 0)) || 1;
  return bands.map((v) => v / norm);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function classifyFromBands(
  kick: number,
  bass: number,
  snare: number,
  high: number,
  strength: number,
  centroid: number
): BeatSoundType {
  const total = kick + bass + snare + high + 1e-6;
  const k = kick / total;
  const ba = bass / total;
  const sn = snare / total;
  if (strength > 0.82 && k + ba > 0.4 && centroid < 900) return 'accent';
  if (k > 0.42 && centroid < 220) return 'kick';
  if (ba > 0.38 && centroid < 350) return 'bass';
  if (sn > 0.32 || (centroid > 700 && centroid < 5500 && high > kick)) return 'snare';
  return 'other';
}

function spectralCentroid(mag: Float64Array, sampleRate: number): number {
  const binHz = sampleRate / FFT_SIZE;
  let num = 0;
  let den = 0;
  for (let i = 1; i < mag.length; i++) {
    num += mag[i] * i * binHz;
    den += mag[i];
  }
  return den > 0 ? num / den : 0;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function estimateBpm(times: number[]): number {
  if (times.length < 4) return 0;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const g = times[i]! - times[i - 1]!;
    if (g > 0.18 && g < 1.2) gaps.push(g);
  }
  if (!gaps.length) return 0;
  const med = median(gaps);
  const bpm = 60 / med;
  if (bpm < 70) return bpm * 2;
  if (bpm > 190) return bpm / 2;
  return Math.round(bpm);
}

export function analyzeAudioBuffer(buffer: AudioBuffer): AudioBeatAnalysis {
  const sampleRate = buffer.sampleRate;
  const samples = mixMono(buffer);
  const duration = samples.length / sampleRate;
  const window = hann(FFT_SIZE);
  const real = new Float64Array(FFT_SIZE);
  const imag = new Float64Array(FFT_SIZE);
  const mag = new Float64Array(FFT_SIZE / 2);
  const prev = new Float64Array(FFT_SIZE / 2);
  const flux: number[] = [];
  const frameTime: number[] = [];
  const frameMag: Float64Array[] = [];

  for (let start = 0; start + FFT_SIZE < samples.length; start += HOP) {
    for (let i = 0; i < FFT_SIZE; i++) {
      real[i] = samples[start + i]! * window[i]!;
      imag[i] = 0;
    }
    fftRadix2(real, imag);
    let f = 0;
    for (let k = 0; k < mag.length; k++) {
      const m = Math.sqrt(real[k]! * real[k]! + imag[k]! * imag[k]!);
      mag[k] = m;
      f += Math.max(0, m - prev[k]!);
      prev[k] = m;
    }
    flux.push(f);
    frameTime.push(start / sampleRate);
    frameMag.push(Float64Array.from(mag));
  }

  const smooth = flux.map((_, i) => {
    const a = flux[i - 2] ?? flux[i]!;
    const b = flux[i - 1] ?? flux[i]!;
    const c = flux[i]!;
    const d = flux[i + 1] ?? flux[i]!;
    const e = flux[i + 2] ?? flux[i]!;
    return (a + b + c + d + e) / 5;
  });

  const localWin = 16;
  const peaks: number[] = [];
  for (let i = 2; i < smooth.length - 2; i++) {
    const v = smooth[i]!;
    if (v <= smooth[i - 1]! || v <= smooth[i + 1]!) continue;
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - localWin); j < Math.min(smooth.length, i + localWin); j++) {
      sum += smooth[j]!;
      n += 1;
    }
    const mean = sum / n;
    if (v < mean * 1.35 + median(smooth.slice(Math.max(0, i - localWin), i + localWin)) * 0.15) {
      continue;
    }
    const t = frameTime[i]!;
    const last = peaks[peaks.length - 1];
    if (last != null && t - frameTime[last]! < MIN_ONSET_GAP_SEC) {
      if (v > smooth[last]!) peaks[peaks.length - 1] = i;
      continue;
    }
    peaks.push(i);
  }

  const maxFlux = Math.max(...peaks.map((i) => smooth[i]!), 1e-6);

  type RawBeat = {
    time: number;
    strength: number;
    fingerprint: number[];
    kick: number;
    bass: number;
    snare: number;
    high: number;
    centroid: number;
  };

  const rawBeats: RawBeat[] = [];
  for (const idx of peaks) {
    const spec = frameMag[idx]!;
    const kick = bandEnergy(spec, sampleRate, 20, 120);
    const bass = bandEnergy(spec, sampleRate, 40, 220);
    const snare = bandEnergy(spec, sampleRate, 150, 4500);
    const high = bandEnergy(spec, sampleRate, 5000, 12000);
    const strength = Math.min(1, smooth[idx]! / maxFlux);
    rawBeats.push({
      time: frameTime[idx]!,
      strength,
      fingerprint: logBands(spec, sampleRate),
      kick,
      bass,
      snare,
      high,
      centroid: spectralCentroid(spec, sampleRate),
    });
  }

  const merged: RawBeat[] = [];
  for (const beat of rawBeats) {
    const prevBeat = merged[merged.length - 1];
    if (prevBeat && beat.time - prevBeat.time < MERGE_SAME_HIT_SEC) {
      if (beat.strength > prevBeat.strength) merged[merged.length - 1] = beat;
      continue;
    }
    merged.push(beat);
  }

  const groups: Array<{ id: string; centroid: number[]; members: RawBeat[] }> = [];
  for (const beat of merged) {
    let best = -1;
    let bestSim = CLUSTER_SIM;
    for (let g = 0; g < groups.length; g++) {
      const sim = cosine(beat.fingerprint, groups[g]!.centroid);
      if (sim > bestSim) {
        bestSim = sim;
        best = g;
      }
    }
    if (best >= 0) {
      const group = groups[best]!;
      group.members.push(beat);
      const dim = beat.fingerprint.length;
      const next = new Array(dim).fill(0);
      for (const m of group.members) {
        for (let i = 0; i < dim; i++) next[i] += m.fingerprint[i]!;
      }
      const inv = 1 / group.members.length;
      const nrm = Math.sqrt(next.reduce((s, v) => s + (v * inv) ** 2, 0)) || 1;
      group.centroid = next.map((v) => (v * inv) / nrm);
    } else {
      groups.push({
        id: `g${groups.length + 1}`,
        centroid: beat.fingerprint.slice(),
        members: [beat],
      });
    }
  }

  const groupType = new Map<string, BeatSoundType>();
  for (const group of groups) {
    const avg = group.members.reduce(
      (acc, m) => {
        acc.kick += m.kick;
        acc.bass += m.bass;
        acc.snare += m.snare;
        acc.high += m.high;
        acc.strength += m.strength;
        acc.centroid += m.centroid;
        return acc;
      },
      { kick: 0, bass: 0, snare: 0, high: 0, strength: 0, centroid: 0 }
    );
    const n = group.members.length;
    groupType.set(
      group.id,
      classifyFromBands(
        avg.kick / n,
        avg.bass / n,
        avg.snare / n,
        avg.high / n,
        avg.strength / n,
        avg.centroid / n
      )
    );
  }

  const beats: AnalyzedBeat[] = merged.map((beat) => {
    const group = groups.find((g) => g.members.includes(beat))!;
    const beatType = groupType.get(group.id) ?? 'other';
    return {
      time: Number(beat.time.toFixed(3)),
      beatType,
      similarityGroup: group.id,
      strength: Number(beat.strength.toFixed(3)),
      confidence: Number(Math.min(0.97, 0.55 + beat.strength * 0.4).toFixed(3)),
    };
  });

  const envelopeSteps = Math.max(120, Math.min(480, Math.round(duration * 20)));
  const hopEnv = Math.max(1, Math.floor(samples.length / envelopeSteps));
  const envelope: BeatEnvelopePoint[] = [];
  let maxRms = 1e-6;
  const rms: number[] = [];
  for (let i = 0; i < envelopeSteps; i++) {
    const a = i * hopEnv;
    const b = Math.min(samples.length, a + hopEnv);
    let sum = 0;
    for (let s = a; s < b; s++) sum += samples[s]! * samples[s]!;
    const e = Math.sqrt(sum / Math.max(1, b - a));
    rms.push(e);
    if (e > maxRms) maxRms = e;
  }
  for (let i = 0; i < rms.length; i++) {
    envelope.push({
      time: (i / Math.max(1, rms.length - 1)) * duration,
      energy: Number(Math.min(1, rms[i]! / maxRms).toFixed(4)),
    });
  }

  return {
    beats,
    envelope,
    bpm: estimateBpm(beats.map((b) => b.time)),
  };
}

export async function analyzeVideoAudio(url: string): Promise<AudioBeatAnalysis> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load audio from the preview.');
  const data = await res.arrayBuffer();
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) throw new Error('Web Audio is not available.');
  const ctx = new AC();
  try {
    const buffer = await ctx.decodeAudioData(data.slice(0));
    return analyzeAudioBuffer(buffer);
  } finally {
    void ctx.close();
  }
}
