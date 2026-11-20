import type { ReactNode } from "react";

export function AuthContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center bg-surface-muted/60 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <div className="w-full max-w-[400px]">{children}</div>
    </main>
  );
}
