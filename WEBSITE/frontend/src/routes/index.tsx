import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useMediaQuery, Spinner, Center, Box } from "@chakra-ui/react";

// Layouts
const DesktopLayout = lazy(() => import("@/components/layouts/DesktopLayout"));
const MobileLayout = lazy(() => import("@/components/layouts/MobileLayout"));

// Pages
const Home = lazy(() => import("@/pages/Home"));
const VISMEDTalks = lazy(() => import("@/pages/VISMEDTalks"));
const FindYourVISMED = lazy(() => import("@/pages/FindYourVISMED"));
const MedicineInformation = lazy(() => import("@/pages/MedicineInformation"));
const DrugHistory = lazy(() => import("@/pages/DrugHistory"));
const Reminder = lazy(() => import("@/pages/Reminder"));
const Setting = lazy(() => import("@/pages/Setting"));

const LoadingScreen = () => (
  <Center h="100vh">
    <Spinner size="xl" />
  </Center>
);

const LayoutWrapper: React.FC = () => {
  const [isMobile] = useMediaQuery(["(max-width: 768px)"]);
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Layout />
      </Suspense>
      {/* Footer */}
      <Box
        position="fixed"
        bottom={0}
        right={{ base: "50%", md: 0 }} // di HP, posisikan ke tengah
        transform={{ base: "translateX(50%)", md: "none" }} // geser agar pas di tengah
        p={2}
        bg="gray.200"
        borderTopLeftRadius={{ base: "none", md: "md" }} // di HP, tidak ada radius
        color="black"
        fontSize="12px"
        textAlign={{ base: "center", md: "right" }} // teks tengah di HP
        w={{ base: "100%", md: "auto" }} // di HP, lebar penuh
      >
        © 2025 Vision Medicine. All rights reserved.
      </Box>
    </>
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
        path: "vismed-talks",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <VISMEDTalks />
          </Suspense>
        ),
      },
      {
        path: "find-your-vismed",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <FindYourVISMED />
          </Suspense>
        ),
      },
      {
        path: "medicine-information",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <MedicineInformation />
          </Suspense>
        ),
      },
      {
        path: "drug-history",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <DrugHistory />
          </Suspense>
        ),
      },
      {
        path: "reminder",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Reminder />
          </Suspense>
        ),
      },
      {
        path: "setting",
        element: (
          <Suspense fallback={<LoadingScreen />}>
            <Setting />
          </Suspense>
        ),
      },
    ],
  },
]);
