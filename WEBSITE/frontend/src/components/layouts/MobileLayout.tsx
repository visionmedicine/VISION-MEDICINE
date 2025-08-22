import React from "react";
import { Flex, Box } from "@chakra-ui/react";
import MobileSidebar from "@/components/sidebar/MobileSidebar";
import { Outlet } from "react-router-dom";
import Footer from "@/components/footer/Footer.tsx";

const MobileLayout: React.FC = () => {
  return (
    <Flex direction="column" minH="80vh">
      <MobileSidebar />
      <Box flex="1" p={2}>
        <Outlet />
      </Box>
      <Footer />
    </Flex>
  );
};

export default React.memo(MobileLayout);
