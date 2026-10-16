"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { brand } from "@/src/config/brand";
import { nav, type LinkTarget, type NavDropdownItem } from "@/src/config/landing";
import { Logo } from "@/components/Logo";

const HOVER_CLOSE_DELAY_MS = 120;
const FOCUSABLE = "a[href], button:not([disabled])";

interface NavAnchorProps {
  readonly href: string;
  readonly target: LinkTarget;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly children: ReactNode;
}

/** Renders a link according to the config `target` rule. */
function NavAnchor({ href, target, className, onClick, children }: NavAnchorProps) {
  if (target === "route") {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  if (target === "external") {
    return (
      <a href={href} className={className} onClick={onClick} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l6-6M4 3h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const linkClass =
  "rounded-full px-3 py-2 text-sm font-medium text-ink-1 transition-colors hover:text-accent motion-reduce:transition-none";

interface DropdownProps {
  readonly label: string;
  readonly items: readonly NavDropdownItem[];
}

function NavDropdown({ label, items }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);
  const panelId = useId();

  const clearTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  // Outside click closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    clearTimer();
    openedByHover.current = true;
    setOpen(true);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  };
  const onClick = () => {
    clearTimer();
    if (open && openedByHover.current) {
      // First click after a hover-open confirms the panel instead of closing it.
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    setOpen((value) => !value);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };
  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && rootRef.current && !rootRef.current.contains(next)) setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onClick}
        className={`${linkClass} inline-flex items-center gap-1.5`}
      >
        {label}
        <ChevronIcon open={open} />
      </button>
      <div
        id={panelId}
        inert={!open}
        className={`absolute left-0 top-full w-128 pt-2 transition-all duration-200 motion-reduce:transition-none ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <ul className="rounded-2xl bg-white p-2 shadow-soft">
          {items.map((item) => (
            <li key={item.name}>
              <NavAnchor
                href={item.href}
                target={item.target}
                onClick={() => setOpen(false)}
                className="flex gap-4 rounded-xl p-3 transition-colors hover:bg-ink-1/5 focus-visible:bg-ink-1/5 motion-reduce:transition-none"
              >
                <span className="pt-1 font-mono text-micro text-ink-5">{item.number}</span>
                <span className="flex flex-col">
                  <span className="font-heading font-semibold text-ink-1">{item.name}</span>
                  <span className="text-sm text-ink-5">{item.oneLiner}</span>
                </span>
              </NavAnchor>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const ctaClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink-1 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent motion-reduce:transition-none";

export function LandingNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();
  const wasOpen = useRef(false);

  const dropdown = nav.links.find((link) => link.kind === "dropdown");

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Scroll lock + focus management for the drawer.
  useEffect(() => {
    if (drawerOpen) {
      wasOpen.current = true;
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
      return () => {
        document.body.style.overflow = "";
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      burgerRef.current?.focus();
    }
  }, [drawerOpen]);

  const onDrawerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeDrawer();
      return;
    }
    if (event.key !== "Tab" || !drawerRef.current) return;
    const nodes = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !drawerRef.current.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !drawerRef.current.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <header className="lv-glass sticky top-0 z-50 h-15 border-b border-ink-6/30">
        <nav aria-label="Primary" className="lv-container flex h-full items-center justify-between">
          <Link href="/" aria-label={brand.name} className="flex shrink-0 items-center">
            <span className="flex brightness-0"><Logo size="md" /></span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {nav.links.map((link) =>
              link.kind === "dropdown" ? (
                <NavDropdown key={link.label} label={link.label} items={link.items} />
              ) : (
                <NavAnchor key={link.label} href={link.href} target={link.target} className={linkClass}>
                  {link.label}
                </NavAnchor>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <NavAnchor href={nav.cta.href} target={nav.cta.target} className={`${ctaClass} hidden md:inline-flex`}>
              {nav.cta.label}
              <ArrowIcon />
            </NavAnchor>
            <button
              ref={burgerRef}
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full text-ink-1 md:hidden"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {drawerOpen ? (
        <div
          id={drawerId}
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${brand.name} menu`}
          onKeyDown={onDrawerKeyDown}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white md:hidden"
        >
          <div className="lv-container flex h-15 shrink-0 items-center justify-between">
            <Link href="/" aria-label={brand.name} onClick={closeDrawer} className="flex items-center">
              <span className="flex brightness-0"><Logo size="md" /></span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close menu"
              onClick={closeDrawer}
              className="inline-flex size-10 items-center justify-center rounded-full text-ink-1"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="lv-container flex flex-1 flex-col gap-6 pb-8 pt-4">
            {dropdown && dropdown.kind === "dropdown" ? (
              <ul className="flex flex-col">
                {dropdown.items.map((item) => (
                  <li key={item.name}>
                    <NavAnchor
                      href={item.href}
                      target={item.target}
                      onClick={closeDrawer}
                      className="flex gap-4 rounded-xl py-3"
                    >
                      <span className="pt-1 font-mono text-micro text-ink-5">{item.number}</span>
                      <span className="flex flex-col">
                        <span className="font-heading font-semibold text-ink-1">{item.name}</span>
                        <span className="text-sm text-ink-5">{item.oneLiner}</span>
                      </span>
                    </NavAnchor>
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="flex flex-col border-t border-ink-6/30 pt-4">
              {nav.links
                .filter((link) => link.kind === "link")
                .map((link) => (
                  <li key={link.label}>
                    <NavAnchor
                      href={link.href}
                      target={link.target}
                      onClick={closeDrawer}
                      className="block py-3 font-heading text-h3 text-ink-1"
                    >
                      {link.label}
                    </NavAnchor>
                  </li>
                ))}
            </ul>
            <NavAnchor href={nav.cta.href} target={nav.cta.target} onClick={closeDrawer} className={`${ctaClass} mt-auto w-full`}>
              {nav.cta.label}
              <ArrowIcon />
            </NavAnchor>
          </div>
        </div>
      ) : null}
    </>
  );
}
