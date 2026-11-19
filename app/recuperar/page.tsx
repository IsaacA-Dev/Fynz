import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AuthContainer } from "@/components/login/auth-container";
import { FormRecuperar } from "@/components/login/form-recuperar";

export default async function Recuperar({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (!code) {
    redirect("/login");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  return (
    <AuthContainer>
      <FormRecuperar
        errorInicial={
          error
            ? "El enlace expiró o no es válido. Solicita uno nuevo desde el inicio de sesión."
            : null
        }
      />
    </AuthContainer>
  );
}
