import { auth } from "@/auth";
import { NavbarClient } from "@/components/navbar-client";

export async function Navbar() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return <NavbarClient isAuthenticated={isAuthenticated} />;
}
