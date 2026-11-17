import { useEffect, useRef, useState } from 'react';

type Section = readonly [id: string, label: string, number: string];

export function SectionNavigation({ sections }: { sections: readonly Section[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState(sections[0]?.[0] ?? 'overview');

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;

    const activeLink = nav.querySelector<HTMLAnchorElement>('a[aria-current="location"]');
    if (!activeLink) return;

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const inset = 12;
    if (linkRect.left < navRect.left + inset) {
      nav.scrollLeft += linkRect.left - navRect.left - inset;
    } else if (linkRect.right > navRect.right - inset) {
      nav.scrollLeft += linkRect.right - navRect.right + inset;
    }
  }, [activeId]);

  useEffect(() => {
    const targets = sections
      .map(([id]) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (!targets.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const activationLine = Math.min(160, window.innerHeight / 3);
      let current = targets[0].id;

      for (const target of targets) {
        if (target.getBoundingClientRect().top <= activationLine) current = target.id;
        else break;
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = targets[targets.length - 1].id;
      }
      setActiveId(previous => previous === current ? previous : current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    // The browser may restore a fragment scroll after the first render.
    const initialHash = window.location.hash.slice(1);
    if (targets.some(target => target.id === initialHash)) setActiveId(initialHash);
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    targets.forEach(target => resizeObserver?.observe(target));

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
      resizeObserver?.disconnect();
    };
  }, [sections]);

  return <nav ref={navRef} aria-label="문서 목차">
    {sections.map(([id, label, number]) => <a key={id} href={`#${id}`} aria-current={activeId === id ? 'location' : undefined}>
      <span>{number}</span>{label}<span className="nav-arrow" aria-hidden="true">↗</span>
    </a>)}
  </nav>;
}
