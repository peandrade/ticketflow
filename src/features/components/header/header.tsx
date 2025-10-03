import { Button } from "../ui/button";
import { getSessionUser } from "@/core/auth";
import { AuthModal, UserMenu } from "../auth";
import React from "react";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-4 flex h-16 items-center justify-between">
        <a href="/" className="text-2xl font-bold italic">TicketFlow</a>

        {user ? (
          <UserMenu user={user} />
        ) : (
          <AuthModal>
            <Button>Entrar / Cadastre-se</Button>
          </AuthModal>
        )}
      </div>
    </header>
  );
}
