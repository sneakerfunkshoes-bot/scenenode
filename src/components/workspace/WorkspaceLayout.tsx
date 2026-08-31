'use client';

import { useState } from 'react';
import type { SoftwareTool } from '@/types';
import { FileExplorer } from './FileExplorer';
import { MainEditor } from './MainEditor';
import { EditAssistant } from './EditAssistant';

interface WorkspaceLayoutProps {
  onSignOut: () => void;
}

export function WorkspaceLayout({ onSignOut }: WorkspaceLayoutProps) {
  const [software, setSoftware] = useState<SoftwareTool>('DaVinci Resolve');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-obsidian text-silver">
      {/* Title bar */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-silver/10 bg-obsidian-100 px-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold tracking-tight text-silver">
            scenenode
          </span>
          <span className="hidden h-3 w-px bg-silver/15 sm:block" />
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-silver-dim sm:inline">
            summer-reel-v3 · untitled breakdown
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-silver/15 px-2 py-0.5 font-mono text-[10px] text-silver-muted">
            {software}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-sm px-2 py-1 font-body text-xs text-silver-dim transition hover:bg-silver/10 hover:text-silver"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* IDE body */}
      <div className="flex min-h-0 flex-1 workspace-grid">
        <FileExplorer />
        <MainEditor software={software} onSoftwareChange={setSoftware} />
        <EditAssistant software={software} />
      </div>

      {/* Status bar */}
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-silver/10 bg-obsidian-100 px-3 font-mono text-[10px] text-silver-dim">
        <span>Ready</span>
        <span>Black · gray · scenenode</span>
      </footer>
    </div>
  );
}
