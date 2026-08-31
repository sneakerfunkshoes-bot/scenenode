'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { scrollToSectionId, sectionIdFromHref } from '@/lib/scroll-to-section';

const BRAND = 'scenenode';

const FOOTER_LINKS = [
  { href: '/#overview', label: 'Overview' },
  { href: '/#features', label: 'Features' },
  { href: '/#examples', label: 'Examples' },
  { href: '/#nles', label: 'Supported NLEs' },
  { href: '/inspect?workspace=1', label: 'Inspect' },
] as const;

export function SiteFooter() {
  const pathname = usePathname();
  const router = useRouter();

  const onNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const sectionId = sectionIdFromHref(href);
    if (!sectionId) return;

    event.preventDefault();
    if (pathname === '/') {
      scrollToSectionId(sectionId);
      return;
    }
    router.push(`/#${sectionId}`);
  };

  return (
    <footer className="border-t border-[#E2E8F0]/10 bg-[#050505]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="space-y-1">
          <Link href="/" className="font-display text-base font-bold tracking-tight text-white">
            {BRAND}
          </Link>
          <p className="text-xs text-[#64748B]">
            Reverse-engineer any short-form edit. Free forever.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(e) => onNavClick(e, link.href)}
                  className="text-[13px] text-[#94A3B8] transition hover:text-[#E2E8F0]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
