"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { FynzLogo } from "@/components/ui/fynz-logo";
import { useToast } from "@/components/ui/toast";
import { cambiarContrasena } from "@/lib/acciones-servidor";

export function FormRecuperar({
  errorInicial,
}: {
  errorInicial: string | null;
}) {
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const valido = contrasena.length >= 8 && contrasena === confirmacion;

  const errorConfirmacion =
    contrasena !== "" && confirmacion !== "" && !valido
      ? contrasena.length < 8
        ? "La contraseña debe tener al menos 8 caracteres."
        : "Las contraseñas no coinciden."
      : undefined;

  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    if (loading || !valido) return;

    setErrorFormulario("");
    setLoading(true);

    try {
      const resultado = await cambiarContrasena(contrasena);
      if (!resultado.ok) {
        setErrorFormulario(resultado.error);
        return;
      }

      addToast(
        "Contraseña actualizada. Ya puedes iniciar sesión.",
        "success"
      );
      router.push("/login");
    } catch {
      setErrorFormulario(
        "No pudimos guardar la contraseña. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[400px] shadow-lift">
      <CardHeader className="items-center gap-2 text-center">
        <FynzLogo height={40} />
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          Nueva contraseña
        </h1>
        <CardDescription>
          {errorInicial
            ? "Solicita un nuevo enlace desde el inicio de sesión."
            : "Elige una contraseña de al menos 8 caracteres."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorInicial ? (
          <Alert
            variant="danger"
            title="No pudimos restablecer la contraseña"
          >
            {errorInicial}
          </Alert>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            {errorFormulario && (
              <Alert
                variant="danger"
                title="No pudimos restablecer la contraseña"
              >
                {errorFormulario}
              </Alert>
            )}

            <FormField label="Nueva contraseña" required>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(evento) => {
                  setContrasena(evento.target.value);
                  if (errorFormulario) setErrorFormulario("");
                }}
                minLength={8}
                required
              />
            </FormField>

            <FormField
              label="Confirmar contraseña"
              error={errorConfirmacion}
              required
            >
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                minLength={8}
                invalid={Boolean(errorConfirmacion)}
                required
              />
            </FormField>

            <Button
              type="submit"
              loading={loading}
              disabled={!valido}
              className="w-full"
            >
              Guardar contraseña
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-line pt-4">
        <Link
          href="/login"
          className="text-sm font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Volver al inicio de sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
