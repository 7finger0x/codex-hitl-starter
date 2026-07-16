import React, { type ReactNode } from "react";

import type { Session } from "../../../../packages/core/src/generated/foundation-contracts";
import { translate, type SupportedLocale } from "../i18n/index";

export interface CapabilityNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export type ShellSessionState =
  | { readonly status: "loading" }
  | { readonly status: "unauthenticated" }
  | { readonly status: "error"; readonly correlationId: string }
  | {
      readonly status: "authenticated";
      readonly session: Session;
      readonly tenantLabel: string;
      readonly environmentLabel: string;
    };

export interface PlatformShellProps {
  readonly locale: SupportedLocale;
  readonly sessionState: ShellSessionState;
  readonly capabilities: readonly CapabilityNavigationItem[];
  readonly children?: ReactNode;
}

const CAPABILITY_ID_PATTERN = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
const LOCAL_HREF_PATTERN = /^\/[A-Za-z0-9/_-]*$/;

function validatedCapabilities(
  capabilities: readonly CapabilityNavigationItem[],
): readonly CapabilityNavigationItem[] {
  const seen = new Set<string>();
  return capabilities.map((capability) => {
    if (
      !CAPABILITY_ID_PATTERN.test(capability.id) ||
      capability.label.length < 1 ||
      capability.label.length > 100 ||
      !LOCAL_HREF_PATTERN.test(capability.href) ||
      seen.has(capability.id)
    ) {
      throw new TypeError("Capability navigation input is malformed");
    }
    seen.add(capability.id);
    return Object.freeze({ ...capability });
  });
}

function SessionContent({
  locale,
  state,
  capabilities,
  children,
}: {
  readonly locale: SupportedLocale;
  readonly state: ShellSessionState;
  readonly capabilities: readonly CapabilityNavigationItem[];
  readonly children?: ReactNode;
}): ReactNode {
  if (state.status === "loading") {
    return (
      <p className="shell-status" role="status" aria-live="polite">
        {translate(locale, "session.loading")}
      </p>
    );
  }
  if (state.status === "unauthenticated") {
    return (
      <section className="shell-panel" aria-labelledby="session-heading">
        <h1 id="session-heading">{translate(locale, "app.name")}</h1>
        <p role="status">{translate(locale, "session.unauthenticated")}</p>
        <a className="primary-action" href="/sign-in">
          {translate(locale, "session.signIn")}
        </a>
      </section>
    );
  }
  if (state.status === "error") {
    return (
      <section className="shell-panel" aria-labelledby="session-error-heading">
        <h1 id="session-error-heading">{translate(locale, "session.error")}</h1>
        <p role="alert">
          {translate(locale, "session.correlation")}: <code>{state.correlationId}</code>
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="context-banner" aria-label={translate(locale, "context.label")}>
        <span>
          <strong>{translate(locale, "context.organization")}:</strong> {state.tenantLabel}
        </span>
        <span>
          <strong>{translate(locale, "context.environment")}:</strong> {state.environmentLabel}
        </span>
      </section>
      {capabilities.length > 0 ? (
        <nav className="capability-navigation" aria-label={translate(locale, "nav.capabilities")}>
          <ul>
            {capabilities.map((capability) => (
              <li key={capability.id}>
                <a href={capability.href}>{capability.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <p className="shell-status" role="status">
          {translate(locale, "capabilities.empty")}
        </p>
      )}
      <p className="capability-advisory">{translate(locale, "capabilities.advisory")}</p>
      {children}
    </>
  );
}

export function PlatformShell({
  locale,
  sessionState,
  capabilities: suppliedCapabilities,
  children,
}: PlatformShellProps): ReactNode {
  const capabilities = validatedCapabilities(suppliedCapabilities);
  return (
    <div className="platform-shell">
      <a className="skip-link" href="#main-content">
        {translate(locale, "nav.skip")}
      </a>
      <header className="shell-header">
        <span className="product-name">{translate(locale, "app.name")}</span>
      </header>
      <main id="main-content" tabIndex={-1}>
        <SessionContent locale={locale} state={sessionState} capabilities={capabilities}>
          {children}
        </SessionContent>
      </main>
      <footer className="shell-footer">{translate(locale, "footer.foundation")}</footer>
    </div>
  );
}
