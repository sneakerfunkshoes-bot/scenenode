'use client';

import { useRef, useState } from 'react';
import { HardDrive, Smartphone, Cloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function ImportPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2200);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*,image/*"
          className="hidden"
          multiple
          onChange={(e) => {
            const count = e.target.files?.length ?? 0;
            if (count) flash(`Imported ${count} local file${count > 1 ? 's' : ''}`);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-sm border border-silver/20 bg-obsidian/50 px-3 py-2 font-body text-xs text-silver-muted transition hover:border-silver/40 hover:text-silver"
        >
          <HardDrive size={14} />
          Upload files
        </button>
        <button
          type="button"
          onClick={() => flash('Phone import ready — drop media from device')}
          className="inline-flex items-center gap-2 rounded-sm border border-silver/20 bg-obsidian/50 px-3 py-2 font-body text-xs text-silver-muted transition hover:border-silver/40 hover:text-silver"
        >
          <Smartphone size={14} />
          Phone
        </button>
        <button
          type="button"
          onClick={() => flash('Google Drive connected (demo)')}
          className="inline-flex items-center gap-2 rounded-sm border border-silver/20 bg-obsidian/50 px-3 py-2 font-body text-xs text-silver-muted transition hover:border-silver/40 hover:text-silver"
        >
          <Cloud size={14} />
          Google Drive
        </button>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-full mt-2 font-mono text-[11px] text-silver-muted"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
