import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportBreakdownMarkers(
  breakdown: VideoBreakdownRecord,
  nle: NleSoftware,
  format: 'xml' | 'fcpxml' | 'json' | 'jsx' | 'ffx' | 'drx'
) {
  const base = breakdown.previewLabel.replace(/[^\w.-]+/g, '_').slice(0, 40);

  if (format === 'ffx') {
    const effect = breakdown.effects[0];
    const params = effect?.parameters?.[0]?.values ?? {
      Threshold: 0.55,
      Brightness: 1.8,
      Radius: 45,
    };
    const ffx = `<?xml version="1.0"?>\n<effect name="SceneCraft_SapphireGlow">\n  <parameter name="Threshold">${params.Threshold ?? 0.55}</parameter>\n  <parameter name="Brightness">${params.Brightness ?? 1.8}</parameter>\n  <parameter name="Radius">${params.Radius ?? 45}</parameter>\n  <easing>cubic-bezier(0.25, 0.1, 0.25, 1.0)</easing>\n</effect>`;
    download(`${base}_glow.ffx`, ffx, 'application/xml');
    return;
  }

  if (format === 'drx') {
    const drx = `<?xml version="1.0"?>\n<DRX version="1.0">\n  <Grade name="${escapeXml(breakdown.previewLabel)}">\n    <Contrast>15</Contrast>\n    <Saturation>10</Saturation>\n    <Shadows>#002B36</Shadows>\n    <Highlights>#FFB86C</Highlights>\n  </Grade>\n</DRX>`;
    download(`${base}_powergrade.drx`, drx, 'application/xml');
    return;
  }

  if (format === 'json') {
    const payload = {
      source: breakdown.videoUrl,
      song: { title: breakdown.songTitle, artist: breakdown.songArtist },
      bpm: breakdown.bpm,
      duration: breakdown.trackDuration,
      beats: breakdown.beatTimestamps,
      markers: breakdown.effects.map((e) => ({
        time: e.timestamp,
        label: e.description,
        type: e.type,
      })),
    };
    download(`${base}_markers.json`, JSON.stringify(payload, null, 2), 'application/json');
    return;
  }

  if (format === 'jsx') {
    const lines = breakdown.effects.map(
      (e) =>
        `  comp.markerProperty.setValueAtTime(${e.timestamp.toFixed(3)}, new MarkerValue("${e.type}: ${e.description.replace(/"/g, '\\"')}"));`
    );
    const jsx = `// SceneCraft — After Effects marker import\n(function () {\n  var comp = app.project.activeItem;\n  if (!(comp instanceof CompItem)) { alert("Open a comp first."); return; }\n${lines.join('\n')}\n})();`;
    download(`${base}_markers.jsx`, jsx, 'text/plain');
    return;
  }

  if (format === 'fcpxml') {
    const markers = breakdown.effects
      .map(
        (e) =>
          `    <marker start="${e.timestamp}s" duration="0s" value="${e.type}: ${escapeXml(e.description)}" />`
      )
      .join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n<fcpxml version="1.9">\n  <resources />\n  <library>\n    <event name="SceneCraft">\n      <project name="${escapeXml(breakdown.previewLabel)}">\n        <sequence duration="${breakdown.trackDuration}s">\n${markers}\n        </sequence>\n      </project>\n    </event>\n  </library>\n</fcpxml>`;
    download(`${base}_markers.fcpxml`, xml, 'application/xml');
    return;
  }

  // DaVinci Resolve XML (simplified marker list)
  const xmlMarkers = breakdown.effects
    .map(
      (e, i) =>
        `    <marker id="${i + 1}" frame="${Math.round(e.timestamp * 30)}" name="${escapeXml(e.type)}" note="${escapeXml(e.description)}" />`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<xmeml version="5">\n  <sequence>\n    <name>${escapeXml(breakdown.previewLabel)}</name>\n    <duration>${Math.round(breakdown.trackDuration * 30)}</duration>\n    <markers>\n${xmlMarkers}\n    </markers>\n  </sequence>\n</xmeml>`;
  download(`${base}_markers.xml`, xml, 'application/xml');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function exportFormatForNle(nle: NleSoftware): 'xml' | 'fcpxml' | 'json' | 'jsx' | 'ffx' | 'drx' {
  if (nle === 'After Effects') return 'ffx';
  if (nle === 'DaVinci Resolve') return 'drx';
  if (nle === 'Premiere Pro') return 'fcpxml';
  return 'json';
}
