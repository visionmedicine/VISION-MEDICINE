import { Box, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import React from "react";

const DesktopSidebar = () => {
  return (
    <Box w="250px" h="100vh" bg="gray.100" p={4} pos="fixed">
      <VStack align="stretch" gap={4}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </VStack>
    </Box>
  );
};

export default React.memo(DesktopSidebar);
