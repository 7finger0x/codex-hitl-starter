export type SupportedLocale = "en" | "es";

const messages = {
  en: {
    "app.name": "Unified AI Trading OS",
    "nav.skip": "Skip to main content",
    "nav.capabilities": "Capabilities",
    "context.label": "Active context",
    "context.organization": "Organization",
    "context.environment": "Environment",
    "session.loading": "Loading session…",
    "session.unauthenticated": "Sign in to select an organization and environment.",
    "session.signIn": "Sign in",
    "session.error": "The session could not be loaded.",
    "session.correlation": "Correlation identifier",
    "capabilities.empty": "No capabilities are currently visible.",
    "capabilities.advisory": "Visibility does not grant authorization.",
    "footer.foundation": "Platform foundation",
  },
  es: {
    "app.name": "Sistema Operativo Unificado de Trading con IA",
    "nav.skip": "Saltar al contenido principal",
    "nav.capabilities": "Capacidades",
    "context.label": "Contexto activo",
    "context.organization": "Organización",
    "context.environment": "Entorno",
    "session.loading": "Cargando la sesión…",
    "session.unauthenticated": "Inicia sesión para seleccionar una organización y un entorno.",
    "session.signIn": "Iniciar sesión",
    "session.error": "No se pudo cargar la sesión.",
    "session.correlation": "Identificador de correlación",
    "capabilities.empty": "No hay capacidades visibles actualmente.",
    "capabilities.advisory": "La visibilidad no concede autorización.",
    "footer.foundation": "Base de la plataforma",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function translate(locale: SupportedLocale, key: MessageKey): string {
  return messages[locale][key];
}
