'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Settings, UserRound, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogoAdminUnlock } from '@/hooks/useLogoAdminUnlock';
import { scrollToSectionId, sectionIdFromHref } from '@/lib/scroll-to-section';
import { cn } from '@/lib/utils';

const BRAND = 'scenenode';

const DESKTOP_LINKS = [
  { href: '/#overview', label: 'Overview' },
  { href: '/#features', label: 'Features' },
  { href: '/#examples', label: 'Examples' },
  { href: '/#nles', label: 'Supported NLEs' },
  { href: '/inspect?workspace=1', label: 'Inspect' },
  { href: '/download', label: 'Download' },
] as const;

const MOBILE_WORKSPACE_LINKS = [
  { href: '/inspect?workspace=1', label: 'Dashboard' },
  { href: '/inspect?workspace=1&nav=projects', label: 'My Projects' },
  { href: '/download', label: 'Vault' },
  { href: '/inspect?workspace=1&nav=history', label: 'History' },
] as const;

const navLinkClass =
  'whitespace-nowrap font-body text-[13px] transition hover:text-[#E2E8F0]';

interface NavbarProps {
  onGetStarted?: () => void;
}

function linkActive(pathname: string, href: string): boolean {
  if (href === '/download') return pathname === '/download';
  if (href.includes('/inspect')) return pathname.startsWith('/inspect');
  return pathname === href;
}

export function Navbar({ onGetStarted }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const onLogoClick = useLogoAdminUnlock();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const onNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const sectionId = sectionIdFromHref(href);
    if (!sectionId) {
      setMobileOpen(false);
      return;
    }

    event.preventDefault();
    setMobileOpen(false);
    if (pathname === '/') {
      scrollToSectionId(sectionId);
      return;
    }
    router.push(`/#${sectionId}`);
  };

  const goWorkspace = () => {
    setMobileOpen(false);
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    router.push('/inspect?workspace=1');
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 safe-area-top',
          scrolled || mobileOpen
            ? 'border-[#E2E8F0]/10 bg-[#050505]/95 backdrop-blur-md'
            : 'border-transparent bg-[#050505]/55 backdrop-blur-md'
        )}
      >
        <nav className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-5 md:h-16 md:px-8">
          <Link
            href="/"
            onClick={onLogoClick}
            className="shrink-0 font-display text-sm font-bold tracking-tight text-white md:text-base"
          >
            {BRAND}
          </Link>

          <ul className="absolute left-1/2 hidden max-w-[min(100%,48rem)] -translate-x-1/2 items-center gap-5 md:flex lg:gap-7">
            {DESKTOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(e) => onNavClick(e, link.href)}
                  className={cn(
                    navLinkClass,
                    linkActive(pathname, link.href) ? 'text-[#E2E8F0]' : 'text-[#94A3B8]'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goWorkspace}
              className="hidden shrink-0 rounded-full border border-[#E2E8F0]/35 bg-[#E2E8F0]/[0.04] px-4 py-1.5 font-body text-[13px] font-medium text-[#E2E8F0] transition hover:border-[#E2E8F0]/60 md:inline-flex"
            >
              Get Started
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex rounded-lg p-2 text-[#94A3B8] transition hover:bg-[#E2E8F0]/10 hover:text-[#E2E8F0] md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-[#050505]/88 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[min(100%,320px)] flex-col border-l border-[#E2E8F0]/10 bg-[#050505] pb-safe md:hidden"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0]/10 px-5 py-4">
                <span className="font-display text-sm font-bold text-white">{BRAND}</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-[#94A3B8] transition hover:bg-[#E2E8F0]/10 hover:text-[#E2E8F0]"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                {MOBILE_WORKSPACE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'rounded-xl px-4 py-3.5 font-body text-base font-medium transition',
                      linkActive(pathname, link.href)
                        ? 'bg-[#E2E8F0]/10 text-[#E2E8F0]'
                        : 'text-[#94A3B8] hover:bg-[#E2E8F0]/5 hover:text-[#E2E8F0]'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={goWorkspace}
                  className="mt-4 rounded-full border border-[#E2E8F0]/35 bg-[#E2E8F0] px-4 py-3.5 font-body text-sm font-semibold text-[#050505] transition hover:bg-white"
                >
                  Get Started
                </button>
              </nav>

              <div className="border-t border-[#E2E8F0]/10 p-4">
                <div className="flex items-center gap-3 rounded-xl bg-[#E2E8F0]/[0.04] px-3 py-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0]/20 bg-[#050505]">
                    <UserRound className="h-4 w-4 text-[#94A3B8]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#E2E8F0]">Creator</p>
                    <p className="truncate text-xs text-[#64748B]">Local session</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[#64748B] transition hover:bg-[#E2E8F0]/10 hover:text-[#E2E8F0]"
                    aria-label="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
