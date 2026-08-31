'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogoAdminUnlock } from '@/hooks/useLogoAdminUnlock';
import { scrollToSectionId, sectionIdFromHref } from '@/lib/scroll-to-section';
import { cn } from '@/lib/utils';

const BRAND = 'scenenode';

const NAV_LINKS = [
  { href: '/#overview', label: 'Overview' },
  { href: '/#features', label: 'Features' },
  { href: '/#examples', label: 'Examples' },
  { href: '/#nles', label: 'Supported NLEs' },
  { href: '/inspect?workspace=1', label: 'Inspect' },
  { href: '/download', label: 'Download' },
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
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        scrolled || mobileOpen
          ? 'border-[#E2E8F0]/10 bg-[#050505]/95 backdrop-blur-md'
          : 'border-transparent bg-[#050505]/55 backdrop-blur-md'
      )}
    >
      <nav className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-16 md:px-8">
        <Link
          href="/"
          onClick={onLogoClick}
          className="shrink-0 font-display text-sm font-bold tracking-tight text-white md:text-base"
        >
          {BRAND}
        </Link>

        <ul className="absolute left-1/2 hidden max-w-[min(100%,48rem)] -translate-x-1/2 items-center gap-5 md:flex lg:gap-7">
          {NAV_LINKS.map((link) => (
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
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex rounded-lg p-2 text-[#94A3B8] transition hover:bg-[#E2E8F0]/10 hover:text-[#E2E8F0] md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#E2E8F0]/10 bg-[#050505] md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => onNavClick(e, link.href)}
                  className={cn(
                    'rounded-lg px-3 py-3 font-body text-base font-medium transition',
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
                className="mt-2 rounded-full border border-[#E2E8F0]/35 bg-[#E2E8F0] px-4 py-3 font-body text-sm font-semibold text-[#050505] transition hover:bg-white"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
