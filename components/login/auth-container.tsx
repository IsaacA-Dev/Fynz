import type { ReactNode } from "react";

export function AuthContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center bg-surface-muted/60 px-4 py-10">
      <div className="w-full max-w-[400px]">{children}</div>
    </main>
  );
}
