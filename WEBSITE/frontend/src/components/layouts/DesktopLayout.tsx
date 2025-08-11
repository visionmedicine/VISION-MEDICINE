import React from "react";
import { Flex, Box } from "@chakra-ui/react";
import DesktopSidebar from "@/components/sidebar/DesktopSidebar";
import { Outlet } from "react-router-dom";

const DesktopLayout: React.FC = () => {
  return (
    <Flex minH="100vh">
      <DesktopSidebar />
      <Box flex="1" p={4} ml="250px">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default React.memo(DesktopLayout);
