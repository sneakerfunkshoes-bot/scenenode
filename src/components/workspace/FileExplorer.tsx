'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Film,
  Music,
  Image as ImageIcon,
  FileCode,
} from 'lucide-react';
import type { ProjectAsset } from '@/types';
import { PROJECT_TREE } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

function AssetIcon({ type, open }: { type: ProjectAsset['type']; open?: boolean }) {
  if (type === 'folder') {
    return open ? (
      <FolderOpen size={14} className="text-silver-muted" />
    ) : (
      <Folder size={14} className="text-silver-dim" />
    );
  }
  if (type === 'video') return <Film size={14} className="text-silver-muted" />;
  if (type === 'audio') return <Music size={14} className="text-silver-muted" />;
  if (type === 'image') return <ImageIcon size={14} className="text-silver-muted" />;
  return <FileCode size={14} className="text-silver-muted" />;
}

function TreeNode({
  asset,
  depth = 0,
  selectedId,
  onSelect,
}: {
  asset: ProjectAsset;
  depth?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = Boolean(asset.children?.length);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setOpen((v) => !v);
          onSelect(asset.id);
        }}
        className={cn(
          'group flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left font-mono text-[12px] transition',
          selectedId === asset.id
            ? 'bg-silver/10 text-silver'
            : 'text-silver-muted hover:bg-silver/5 hover:text-silver'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown size={12} className="shrink-0 text-silver-dim" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-silver-dim" />
          )
        ) : (
          <span className="inline-block w-3" />
        )}
        <AssetIcon type={asset.type} open={open} />
        <span className="truncate">{asset.name}</span>
      </button>
      {hasChildren && open &&
        asset.children!.map((child) => (
          <TreeNode
            key={child.id}
            asset={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function FileExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>('a1');

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-silver/10 bg-obsidian-50/80">
      <div className="flex items-center justify-between border-b border-silver/10 px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver-dim">
          Explorer
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-widest text-silver-dim/80">
          Project Assets
        </p>
        {PROJECT_TREE.map((node) => (
          <TreeNode
            key={node.id}
            asset={node}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>
    </aside>
  );
}
