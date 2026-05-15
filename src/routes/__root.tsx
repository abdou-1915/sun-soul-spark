import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">Cette page n'existe pas ou a été déplacée.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1a1a2e" },
      { title: "Atelier Pro — Gestion CNC, Laser & Publicité" },
      { name: "description", content: "Application de gestion d'atelier : clients, commandes, finances et matériaux." },
      { property: "og:title", content: "Atelier Pro — Gestion CNC, Laser & Publicité" },
      { name: "twitter:title", content: "Atelier Pro — Gestion CNC, Laser & Publicité" },
      { property: "og:description", content: "Application de gestion d'atelier : clients, commandes, finances et matériaux." },
      { name: "twitter:description", content: "Application de gestion d'atelier : clients, commandes, finances et matériaux." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0204d737-c786-46c2-bcc3-88fca122a59c/id-preview-bf37484d--e4d97ad0-6617-4685-99a4-9f64541b2888.lovable.app-1778775715784.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0204d737-c786-46c2-bcc3-88fca122a59c/id-preview-bf37484d--e4d97ad0-6617-4685-99a4-9f64541b2888.lovable.app-1778775715784.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <Providers>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center gap-2 border-b border-border bg-card/50 px-4 backdrop-blur sticky top-0 z-10">
              <SidebarTrigger />
              <div className="ml-2 text-sm font-medium text-muted-foreground">Atelier Pro</div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </Providers>
  );
}
