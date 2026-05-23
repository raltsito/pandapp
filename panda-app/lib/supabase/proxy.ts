import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type AppRole = "CLIENTE" | "ADMIN" | "REPARTIDOR";

const ROLE_HOME: Record<AppRole, string> = {
  CLIENTE: "/cliente/catalogo",
  ADMIN: "/admin/dashboard",
  REPARTIDOR: "/repartidor/dashboard",
};

const ROLE_PREFIX: Record<AppRole, string> = {
  CLIENTE: "/cliente",
  ADMIN: "/admin",
  REPARTIDOR: "/repartidor",
};

const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback"];

function isPublic(path: string) {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = !isPublic(path);

  // Sin sesión y ruta protegida → login
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión: obtener rol y validar acceso
  if (user) {
    const { data: rolRows } = await supabase
      .from("rol")
      .select("nombre_rol, users!inner(auth_id)")
      .eq("users.auth_id", user.id);

    const nombres = (rolRows ?? []).map(r => r.nombre_rol as AppRole);
    const PRIORITY: AppRole[] = ["ADMIN", "REPARTIDOR", "CLIENTE"];
    const role = PRIORITY.find(r => nombres.includes(r)) ?? "CLIENTE";

    // Si está en login/register/root, mandar a su home
    if (path === "/" || path === "/login" || path === "/register") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }

    // Si intenta acceder a un módulo de otro rol, redirigir a su home
    const allowedPrefix = ROLE_PREFIX[role];
    const otherPrefixes = (Object.keys(ROLE_PREFIX) as AppRole[])
      .filter((r) => r !== role)
      .map((r) => ROLE_PREFIX[r]);

    const accedeAOtroModulo = otherPrefixes.some(
      (p) => path.startsWith(p + "/") || path === p,
    );

    if (accedeAOtroModulo && !path.startsWith(allowedPrefix)) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }
  }

  return response;
}
