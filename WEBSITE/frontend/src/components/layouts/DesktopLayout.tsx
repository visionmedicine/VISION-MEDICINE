import React, { useState } from "react";
import { Flex, Box } from "@chakra-ui/react";
import DesktopSidebar from "@/components/sidebar/DesktopSidebar";
import { Outlet } from "react-router-dom";
import Footer from "@/components/footer/Footer.tsx";

const DesktopLayout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Flex minH="100vh" flexDir="column">
      <Flex flex="1">
        <DesktopSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <Box
          flex="1"
          p={4}
          ml={isOpen ? "250px" : "80px"}
          transition="margin-left 0.3s ease"
        >
          <Outlet />
        </Box>
      </Flex>
      <Footer />
    </Flex>
  );
};

export default React.memo(DesktopLayout);
