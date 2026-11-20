"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
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
import { solicitarRecuperacion } from "@/lib/acciones-servidor";
import { esEmailValido, normalizarEmail } from "@/lib/utils/email";
import { traducirErrorAuth } from "@/lib/utils/errores-auth";

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [loading, setLoading] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [recuperacionEnviada, setRecuperacionEnviada] = useState(false);

  const router = useRouter();
  const { addToast } = useToast();

  const cambiarModo = () => {
    setIsLogin((valor) => !valor);
    setEmailError("");
    setPasswordError("");
    setErrorFormulario("");
    setRecuperacionEnviada(false);
  };

  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    if (loading) return;

    setErrorFormulario("");
    setEmailError("");
    setPasswordError("");

    const emailNormalizado = normalizarEmail(email);

    if (!esEmailValido(emailNormalizado)) {
      setEmailError("Escribe un correo válido, ej. nombre@dominio.com");
      return;
    }

    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // Se instancia dentro del handler para que /login pueda prerenderizarse
      // sin necesitar las variables de Supabase en tiempo de compilación.
      const supabase = createBrowserSupabase();

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password,
        });

        if (error) {
          setErrorFormulario(traducirErrorAuth(error));
          return;
        }

        addToast("Bienvenido de nuevo", "success");
        router.push("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: emailNormalizado,
          password,
        });

        if (error) {
          setErrorFormulario(traducirErrorAuth(error));
          return;
        }

        if (data.session) {
          addToast("Cuenta creada. Bienvenido a Fynz", "success");
          router.push("/");
          router.refresh();
          return;
        }

        addToast("Revisa tu correo para confirmar tu cuenta", "success");
      }
    } catch {
      setErrorFormulario(
        "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const solicitarEnlace = async () => {
    if (recuperando) return;

    setErrorFormulario("");
    setEmailError("");

    const emailNormalizado = normalizarEmail(email);
    if (!esEmailValido(emailNormalizado)) {
      setEmailError("Escribe tu correo para recuperar tu contraseña");
      return;
    }

    setRecuperando(true);
    try {
      const resultado = await solicitarRecuperacion(emailNormalizado);
      if (!resultado.ok) {
        setErrorFormulario(resultado.error);
        return;
      }
      setRecuperacionEnviada(true);
    } catch {
      setErrorFormulario(
        "No pudimos enviar el enlace. Inténtalo de nuevo en un momento."
      );
    } finally {
      setRecuperando(false);
    }
  };

  return (
    <Card className="w-full max-w-[400px] shadow-lift">
      <CardHeader className="items-center gap-2 text-center">
        <FynzLogo height={40} />
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          {isLogin ? "Inicia sesión" : "Crea tu cuenta"}
        </h1>
        <CardDescription>
          {isLogin
            ? "Tu Disponible Real te está esperando."
            : "Empieza a saber cuánto puedes gastar hoy."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {errorFormulario && (
            <Alert
              variant="danger"
              title={
                isLogin
                  ? "No pudimos iniciar sesión"
                  : "No pudimos crear tu cuenta"
              }
            >
              {errorFormulario}
            </Alert>
          )}

          <FormField label="Correo electrónico" error={emailError} required>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="tu@email.com"
              value={email}
              onChange={(evento) => {
                setEmail(evento.target.value);
                if (emailError) setEmailError("");
                if (errorFormulario) setErrorFormulario("");
              }}
              invalid={Boolean(emailError)}
              required
            />
          </FormField>

          <FormField label="Contraseña" error={passwordError} required>
            <Input
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(evento) => {
                setPassword(evento.target.value);
                if (passwordError) setPasswordError("");
                if (errorFormulario) setErrorFormulario("");
              }}
              minLength={6}
              invalid={Boolean(passwordError)}
              required
            />
          </FormField>

          <Button type="submit" loading={loading} className="w-full">
            {loading
              ? "Procesando…"
              : isLogin
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col items-center gap-2 border-t border-line pt-4">
        <button
          type="button"
          onClick={cambiarModo}
          className="text-sm font-medium text-brand transition-colors hover:text-brand-hover"
        >
          {isLogin
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>

        {isLogin &&
          (recuperacionEnviada ? (
            <p
              aria-live="polite"
              className="text-center text-xs leading-relaxed text-fg-muted"
            >
              Si ese correo existe, recibirás un enlace para restablecerlo.
            </p>
          ) : (
            <button
              type="button"
              onClick={solicitarEnlace}
              disabled={recuperando}
              className="text-xs font-medium text-fg-muted transition-colors hover:text-fg disabled:opacity-60"
            >
              {recuperando ? "Enviando…" : "¿Olvidaste tu contraseña?"}
            </button>
          ))}
      </CardFooter>
    </Card>
  );
}
