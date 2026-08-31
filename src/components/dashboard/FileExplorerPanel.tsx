'use client';

import { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Cloud,
  FileText,
  Film,
  Folder,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Music,
  Upload,
} from 'lucide-react';
import type { ProjectAsset } from '@/types';
import { PROJECT_TREE } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

function AssetIcon({ type, open }: { type: ProjectAsset['type']; open?: boolean }) {
  if (type === 'folder') {
    return open ? (
      <FolderOpen size={14} className="text-[#94A3B8]" />
    ) : (
      <Folder size={14} className="text-[#64748B]" />
    );
  }
  if (type === 'video') return <Film size={14} className="text-[#94A3B8]" />;
  if (type === 'audio') return <Music size={14} className="text-[#94A3B8]" />;
  if (type === 'image') return <ImageIcon size={14} className="text-[#94A3B8]" />;
  if (type === 'log') return <FileText size={14} className="text-[#C0C0C0]" />;
  return <FileText size={14} className="text-[#94A3B8]" />;
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
          'flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left font-mono text-[12px] transition',
          selectedId === asset.id
            ? 'bg-[#E2E8F0]/10 text-[#E2E8F0]'
            : 'text-[#94A3B8] hover:bg-[#E2E8F0]/5 hover:text-[#E2E8F0]'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown size={12} className="shrink-0 text-[#64748B]" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-[#64748B]" />
          )
        ) : (
          <span className="inline-block w-3 shrink-0" />
        )}
        <AssetIcon type={asset.type} open={open} />
        <span className="truncate">{asset.name}</span>
      </button>
      {hasChildren &&
        open &&
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

export function FileExplorerPanel() {
  const [selectedId, setSelectedId] = useState<string | null>('a1');
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2200);
  };

  return (
    <aside className="flex h-full min-w-0 flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-[#C0C0C0]/10 px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748B]">
          Explorer
        </span>
        <span className="font-mono text-[10px] text-[#64748B]">Assets</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-widest text-[#64748B]/80">
          Project / Clips / Audio / Guides
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

      <div className="border-t border-[#C0C0C0]/10 p-3">
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*,image/*,.log,.txt"
          multiple
          className="hidden"
          onChange={(e) => {
            const count = e.target.files?.length ?? 0;
            if (count) flash(`Added ${count} file${count > 1 ? 's' : ''} to Uploaded Clips`);
            e.target.value = '';
          }}
        />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#C0C0C0]/25 bg-[#E2E8F0]/[0.06] px-3 py-2.5 font-body text-xs font-medium text-[#E2E8F0] transition hover:border-[#C0C0C0]/45 hover:bg-[#E2E8F0]/10"
          >
            <Upload size={14} />
            Upload Files
          </button>
          <button
            type="button"
            onClick={() => {
              fileRef.current?.click();
              flash('Google Drive picker (demo) — local fallback opened');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#C0C0C0]/15 bg-[#050505] px-3 py-2.5 font-body text-xs text-[#94A3B8] transition hover:border-[#C0C0C0]/35 hover:text-[#E2E8F0]"
          >
            <Cloud size={14} />
            Google Drive
          </button>
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-[#64748B]">
            <HardDrive size={11} />
            Device or Drive import
          </p>
          {notice && (
            <p className="font-mono text-[10px] text-[#C0C0C0]">{notice}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
