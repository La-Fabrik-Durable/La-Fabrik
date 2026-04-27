import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";
import {
  DocsArchitectureRoute,
  DocsFeaturesRoute,
  DocsLayoutRoute,
  DocsReadmeRoute,
  DocsTargetArchitectureRoute,
} from "@/pages/docs/DocsRouteComponents";

const rootRoute = createRootRoute({
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsLayoutRoute,
});

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  component: DocsReadmeRoute,
});

const docsArchitectureRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/architecture",
  component: DocsArchitectureRoute,
});

const docsTargetArchitectureRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/target-architecture",
  component: DocsTargetArchitectureRoute,
});

const docsFeaturesRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/features",
  component: DocsFeaturesRoute,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  docsRoute.addChildren([
    docsIndexRoute,
    docsArchitectureRoute,
    docsTargetArchitectureRoute,
    docsFeaturesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
