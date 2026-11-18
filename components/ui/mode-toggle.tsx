"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModeToggleProps {
  isLogin: boolean;
  onToggle: (mode: "login" | "register") => void;
}

export function ModeToggle({ isLogin, onToggle }: ModeToggleProps) {
  return (
    <Tabs
      defaultValue="login"
      value={isLogin ? "login" : "register"}
      onValueChange={(valor) => onToggle(valor === "login" ? "login" : "register")}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login" className="h-9 w-full">
          Login
        </TabsTrigger>
        <TabsTrigger value="register" className="h-9 w-full">
          Registro
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
