import React from "react";
import { Flex, Box } from "@chakra-ui/react";
import MobileSidebar from "@/components/sidebar/MobileSidebar";
import { Outlet } from "react-router-dom";

const MobileLayout: React.FC = () => {
  return (
    <Flex direction="column" minH="100vh">
      <MobileSidebar />
      <Box flex="1" p={2}>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default React.memo(MobileLayout);
