import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { GameFilterProvider } from "../context/GameFilterContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getGames } from "../server/games";
import { checkAdminAuth } from "../server/auth";

import appCss from "../styles.css?url";

export interface MyRouterContext {
  auth: {
    isAuthenticated: boolean;
  };
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const { authenticated } = await checkAdminAuth();
    return {
      auth: {
        isAuthenticated: authenticated,
      },
    };
  },
  loader: () => getGames(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "SetPlay — Live FGC Tournament Stream Hub" },
      { title: "SetPlay" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

const queryClient = new QueryClient();

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased selection:bg-accent/20">
        <QueryClientProvider client={queryClient}>
          <GameFilterProvider>
            <Header />
            {children}
            <Footer />
          </GameFilterProvider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  );
}
