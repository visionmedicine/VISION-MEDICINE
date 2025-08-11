import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useMediaQuery, Spinner, Center } from "@chakra-ui/react";

// Lazy load layouts
const DesktopLayout = lazy(() => import("@/components/layouts/DesktopLayout"));
const MobileLayout = lazy(() => import("@/components/layouts/MobileLayout"));

// Lazy load pages
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const LoadingScreen = () => (
  <Center h="100vh">
    <Spinner size="xl" />
  </Center>
);

// Wrapper untuk memilih layout
const LayoutWrapper: React.FC = () => {
  const [isMobile] = useMediaQuery(["(max-width: 768px)"]); // ✅ pakai array
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Layout />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutWrapper />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "about",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <About />
          </Suspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Dashboard />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <NotFound />
      </Suspense>
    ),
  },
]);
