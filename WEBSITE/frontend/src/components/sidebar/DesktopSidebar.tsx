import React from "react";
import { Box, Stack, HStack, Icon, Image, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { MENU_ITEMS } from "@/utils/constants";

const DesktopSidebar: React.FC = () => {
  return (
    <Box
      w="250px"
      h="100vh"
      bg="gray.100"
      p={4}
      pos="fixed"
      display="flex"
      flexDirection="column"
      borderRight="2px solid #ffffff" // garis pembatas putih
      boxShadow="2px 0 10px 4px rgba(255, 255, 255, 0.4)" // neon shadow putih di kanan
      // kamu bisa adjust boxShadow sesuai kebutuhan
    >
      {/* Logo */}
      <Box mb={14} textAlign="center">
        <NavLink to="/">
          <Image
            src="/Logo VISMED Official.png"
            alt="VISMED Logo"
            maxW="90px"
            h="auto"
            mx="auto"
            objectFit="contain"
          />
        </NavLink>
      </Box>

      {/* Menu */}
      <Stack align="stretch" gap={4} direction="column">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              textDecoration: "none",
              backgroundColor: isActive ? "#E2E8F0" : "transparent",
              borderRadius: "8px",
              padding: "10px",
            })}
          >
            <HStack>
              <Icon as={item.icon} boxSize={5} color="black" />
              <Text color="black" fontWeight="bold">
                {item.label}
              </Text>
            </HStack>
          </NavLink>
        ))}
      </Stack>
    </Box>
  );
};

export default React.memo(DesktopSidebar);
