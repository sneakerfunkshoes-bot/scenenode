export type AnalysisWorkerId = 'audio' | 'visual' | 'vision';

export interface AnalysisStageEvent {
  worker: AnalysisWorkerId;
  stage: string;
  label: string;
  progress: number;
  ms?: number;
}

export const ANALYSIS_WORKERS: Record<
  AnalysisWorkerId,
  { label: string; stages: string[] }
> = {
  audio: {
    label: 'Worker A — Audio transients & BPM',
    stages: ['Detecting kick/snare transients', 'Mapping beat grid to 16th notes'],
  },
  visual: {
    label: 'Worker B — Frame differencing',
    stages: ['Extracting optical flow vectors', 'Tagging whip pans & flash frames'],
  },
  vision: {
    label: 'Worker C — Vision LLM compiler',
    stages: ['OCR text layers', 'Reading CC curves & glow stacks'],
  },
};

export function estimateBeatGrid(duration: number, bpm = 120): number[] {
  const beatSec = 60 / bpm;
  const beats: number[] = [];
  for (let t = 0; t <= duration + beatSec; t += beatSec) {
    beats.push(Number(t.toFixed(3)));
  }
  return beats;
}

export async function runParallelAnalysisStages(
  onStage: (event: AnalysisStageEvent) => void,
  durationHint = 30
): Promise<{ bpm: number; beatTimestamps: number[] }> {
  const bpm = 120;
  const beatTimestamps = estimateBeatGrid(durationHint, bpm);

  const workers: Array<{ id: AnalysisWorkerId; delay: number }> = [
    { id: 'audio', delay: 200 },
    { id: 'visual', delay: 350 },
    { id: 'vision', delay: 500 },
  ];

  await Promise.all(
    workers.map(({ id, delay }) => {
      const meta = ANALYSIS_WORKERS[id];
      return new Promise<void>((resolve) => {
        const start = Date.now();
        let step = 0;
        const tick = () => {
          const label = meta.stages[step] ?? meta.stages[meta.stages.length - 1];
          onStage({
            worker: id,
            stage: `${id}-${step}`,
            label,
            progress: Math.min(100, ((step + 1) / meta.stages.length) * 100),
            ms: Date.now() - start,
          });
          step += 1;
          if (step < meta.stages.length) {
            setTimeout(tick, delay / meta.stages.length);
          } else {
            resolve();
          }
        };
        setTimeout(tick, delay / 2);
      });
    })
  );

  return { bpm, beatTimestamps };
}
