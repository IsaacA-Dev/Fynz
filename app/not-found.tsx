import Link from "next/link";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center bg-surface-muted px-6 py-10">
      <Card className="w-full max-w-md p-8 text-center">
        <Ghost
          className="mx-auto size-16 text-brand"
          aria-hidden
        />
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-fg">
          404
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Página no encontrada
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </Card>
    </main>
  );
}
