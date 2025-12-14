import { auth } from "@/auth";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const session = await auth();
  const isAuthenticated = !!session?.user;
  // Hämta rollen (om användaren är inloggad)
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <NavbarClient 
      isAuthenticated={isAuthenticated} 
      isAdmin={isAdmin} // Skicka med prop:en
    />
  );
}