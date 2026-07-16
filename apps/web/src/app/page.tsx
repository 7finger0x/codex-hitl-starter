import { PlatformShell } from "../components/platform-shell";

export default function HomePage() {
  return (
    <PlatformShell locale="en" sessionState={{ status: "unauthenticated" }} capabilities={[]} />
  );
}
