'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  History,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  Settings,
  Vault,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type WorkspaceNavId = 'dashboard' | 'projects' | 'vault' | 'history';

const NAV: Array<{
  id: WorkspaceNavId;
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'My Projects', icon: FolderKanban },
  { id: 'vault', label: 'Vault', icon: Vault, href: '/download' },
  { id: 'history', label: 'History', icon: History },
];

interface WorkspaceShellProps {
  children: React.ReactNode;
  title?: string;
  /** Pass `null` to hide the status row (e.g. import empty state). */
  status?: React.ReactNode | null;
  /** Optional metrics row under status (analysis summary). */
  summary?: React.ReactNode;
  /** Compact row under title — e.g. NLE selector. */
  toolbar?: React.ReactNode;
  actions?: React.ReactNode;
  activeNav?: WorkspaceNavId;
  onNavChange?: (id: WorkspaceNavId) => void;
  className?: string;
  /** When false, sidebar is fully hidden (analysis fullscreen). Default true. */
  sidebarVisible?: boolean;
  /** Shows a subtle menu control in the header to toggle the sidebar. */
  onSidebarToggle?: () => void;
}

export function WorkspaceShell({
  children,
  title = 'Reference Edit Analysis',
  status,
  summary,
  toolbar,
  actions,
  activeNav = 'dashboard',
  onNavChange,
  className,
  sidebarVisible = true,
  onSidebarToggle,
}: WorkspaceShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNavItem = (item: (typeof NAV)[number]) => {
    const Icon = item.icon;
    const active = item.id === activeNav;
    const classNameNav = cn(
      'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition',
      active ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
    );

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={classNameNav}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavChange?.(item.id);
          setMobileMenuOpen(false);
        }}
        className={classNameNav}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </button>
    );
  };

  return (
    <div className={cn('flex h-[100svh] min-h-0 w-full overflow-hidden bg-black text-zinc-100', className)}>
      <aside
        className={cn(
          'h-full shrink-0 border-r border-zinc-800/80 bg-zinc-950/90 transition-all duration-300',
          sidebarVisible
            ? 'hidden w-0 overflow-hidden border-0 md:flex md:w-56 md:flex-col'
            : 'hidden w-0 overflow-hidden border-0'
        )}
        aria-hidden={!sidebarVisible}
      >
        <Link
          href="/"
          className="flex h-14 items-center gap-2 border-b border-zinc-800/80 px-4 font-semibold tracking-tight text-white"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-[10px] font-bold">
            SN
          </span>
          <span className="text-sm">scenenode</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNav;
            const classNameNav = cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition',
              active
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200'
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className={classNameNav}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavChange?.(item.id)}
                className={classNameNav}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-zinc-800/80 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-zinc-400">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <UserRound className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-200">Creator</p>
              <p className="truncate text-[10px] text-zinc-500">Local session</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 bg-zinc-950/50 px-4 safe-area-top sm:px-7">
          <div
            className={cn(
              'flex items-start justify-between gap-4',
              summary ? 'pt-3 pb-3' : 'pt-3.5 pb-3'
            )}
          >
            <div className="analysis-header-content flex min-w-0 flex-1 flex-col items-start gap-1.5">
              <div className="flex w-full items-center gap-2.5">
                {sidebarVisible ? (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 md:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                ) : null}
                {onSidebarToggle ? (
                  <button
                    type="button"
                    onClick={onSidebarToggle}
                    className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 md:inline-flex"
                    aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                    title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                  >
                    {sidebarVisible ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
                <h1 className="m-0 text-base font-semibold tracking-tight text-white sm:text-lg">
                  {title}
                </h1>
              </div>

              {toolbar ? (
                <div
                  className={cn(
                    'w-full min-w-0',
                    (onSidebarToggle || sidebarVisible) && 'pl-[42px] md:pl-0',
                    sidebarVisible && 'md:pl-0'
                  )}
                >
                  {toolbar}
                </div>
              ) : null}

              {status !== null && status !== undefined ? (
                <div
                  className={cn(
                    'flex min-h-[18px] items-center text-[12px] text-zinc-500',
                    (onSidebarToggle || sidebarVisible) && 'pl-[42px] md:pl-0'
                  )}
                >
                  {status}
                </div>
              ) : null}

              {summary ? (
                <div
                  className={cn(
                    'analysis-summary flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500 sm:text-[12px]',
                    (onSidebarToggle || sidebarVisible) && 'pl-[42px] md:pl-0'
                  )}
                >
                  {summary}
                </div>
              ) : null}
            </div>

            {actions ? (
              <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>
            ) : null}
          </div>
        </header>
        <div className="analysis-divider h-px w-full shrink-0 bg-zinc-800/80" />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,300px)] flex-col border-r border-zinc-800/80 bg-zinc-950 p-4 pb-safe md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-sm font-semibold text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  scenenode
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">{NAV.map(mobileNavItem)}</nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
