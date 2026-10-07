"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

type DashboardLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
};

export default function DashboardLink({ href, className, children }: DashboardLinkProps) {
  const [opening, setOpening] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    event.preventDefault();
    if (opening) return;

    setOpening(true);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => window.location.assign(href), prefersReducedMotion ? 120 : 680);
  }

  return (
    <>
      <a className={className} href={href} onClick={handleClick} aria-busy={opening}>
        {children}
      </a>
      {opening && (
        <div className="dashboard-loader" role="status" aria-live="polite" aria-label="Opening Ascend dashboard">
          <div className="loader-orbit" aria-hidden="true">
            <span className="loader-orbit__track" />
            <span className="loader-orbit__planet" />
            <span className="loader-mark">A</span>
          </div>
          <p className="loader-title">Ascend</p>
          <p className="loader-caption">Opening your dashboard</p>
          <span className="loader-progress" aria-hidden="true"><span /></span>
        </div>
      )}
    </>
  );
}
