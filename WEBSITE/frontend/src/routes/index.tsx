/** @jsxImportSource @emotion/react */
import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { useMediaQuery, Center, Box, Flex } from "@chakra-ui/react";
import { keyframes, css } from "@emotion/react";

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

// Keyframes animasi titik bergelombang
const waveDots = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

// Loader custom
const LoadingScreen = () => (
  <Center
    position="fixed"
    top={0}
    left={0}
    w="100vw"
    h="100vh"
    bg="rgba(255, 255, 255, 0.95)"
    zIndex={99999}
  >
    <Flex gap="8px">
      <Box
        w="14px"
        h="14px"
        borderRadius="50%"
        bg="blue.500"
        css={css`
          animation: ${waveDots} 1.4s infinite ease-in-out;
        `}
      />
      <Box
        w="14px"
        h="14px"
        borderRadius="50%"
        bg="blue.500"
        css={css`
          animation: ${waveDots} 1.4s infinite ease-in-out;
          animation-delay: -0.16s;
        `}
      />
      <Box
        w="14px"
        h="14px"
        borderRadius="50%"
        bg="blue.500"
        css={css`
          animation: ${waveDots} 1.4s infinite ease-in-out;
          animation-delay: -0.32s;
        `}
      />
    </Flex>
  </Center>
);

const LayoutWrapper: React.FC = () => {
  const [isMobile] = useMediaQuery(["(max-width: 768px)"]);
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
