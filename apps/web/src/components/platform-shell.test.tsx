import assert from "node:assert/strict";
import { test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { Session } from "../../../../packages/core/src/generated/foundation-contracts";
import { GET as getLiveness } from "../app/health/live/route";
import { PlatformShell } from "./platform-shell";

const SESSION: Session = {
  session_id: "01941f29-7c7b-7000-8000-000000000020",
  user_id: "01941f29-7c7b-7000-8000-000000000021",
  authentication_strength: "multi_factor",
  active_tenant_id: "01941f29-7c7b-7000-8000-000000000022",
  active_environment_id: "01941f29-7c7b-7000-8000-000000000023",
  tenant_contexts: [
    {
      tenant_id: "01941f29-7c7b-7000-8000-000000000022",
      membership_id: "01941f29-7c7b-7000-8000-000000000024",
      environments: ["01941f29-7c7b-7000-8000-000000000023"],
    },
  ],
};

test("unauthenticated shell has accessible landmarks and explicit session status", () => {
  const html = renderToStaticMarkup(
    <PlatformShell locale="en" sessionState={{ status: "unauthenticated" }} capabilities={[]} />,
  );
  assert.match(html, /href="#main-content"/);
  assert.match(html, /<header/);
  assert.match(html, /<main[^>]*id="main-content"/);
  assert.match(html, /<footer/);
  assert.match(html, /role="status"/);
  assert.match(html, /Sign in to select an organization and environment/);
  assert.doesNotMatch(html, /aria-label="Capabilities"/);
});

test("authenticated navigation derives only from supplied capabilities", () => {
  const html = renderToStaticMarkup(
    <PlatformShell
      locale="en"
      sessionState={{
        status: "authenticated",
        session: SESSION,
        tenantLabel: "Synthetic Alpha",
        environmentLabel: "Paper",
      }}
      capabilities={[
        { id: "research.notes", label: "Research notes", href: "/extensions/research-notes" },
      ]}
    />,
  );
  assert.match(html, /Synthetic Alpha/);
  assert.match(html, /Paper/);
  assert.match(html, /aria-label="Active context"/);
  assert.match(html, /aria-label="Capabilities"/);
  assert.match(html, /href="\/extensions\/research-notes"/);
  assert.match(html, /Research notes/);
  assert.doesNotMatch(html, /href="\/(?:trading|broker|admin)(?:\/|")/);
});

test("empty capability projection is visible and never treated as authorization", () => {
  const html = renderToStaticMarkup(
    <PlatformShell
      locale="en"
      sessionState={{
        status: "authenticated",
        session: SESSION,
        tenantLabel: "Synthetic Alpha",
        environmentLabel: "Sandbox",
      }}
      capabilities={[]}
    />,
  );
  assert.match(html, /No capabilities are currently visible/);
  assert.match(html, /Visibility does not grant authorization/);
});

test("loading and error states are localized without embedding raw failures", () => {
  const loading = renderToStaticMarkup(
    <PlatformShell locale="es" sessionState={{ status: "loading" }} capabilities={[]} />,
  );
  assert.match(loading, /Cargando la sesión/);

  const failed = renderToStaticMarkup(
    <PlatformShell
      locale="es"
      sessionState={{ status: "error", correlationId: "safe-correlation" }}
      capabilities={[]}
    />,
  );
  assert.match(failed, /No se pudo cargar la sesión/);
  assert.match(failed, /safe-correlation/);
  assert.doesNotMatch(failed, /stack|password|token/i);
});

test("web liveness route is no-store and emits the closed Health shape", async () => {
  const response = await getLiveness();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(body.status, "ok");
  assert.equal(body.service, "foundation-web");
  assert.equal(body.version, "0.0.0");
  assert.deepEqual(body.checks, { process: "ok" });
  assert.equal(typeof body.time, "string");
  assert.equal(Object.keys(body).sort().join(","), "checks,service,status,time,version");
});
