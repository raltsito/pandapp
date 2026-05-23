import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

const ROLE_HOME = {
  CLIENTE: "/cliente/catalogo",
  ADMIN: "/admin/dashboard",
  REPARTIDOR: "/repartidor/dashboard",
} as const;

export default async function Home() {
  const session = await getSessionUser();
  if (session) redirect(ROLE_HOME[session.role]);
  redirect("/login");
}
