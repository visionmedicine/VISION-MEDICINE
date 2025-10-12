// DesktopSidebar.tsx
import React from "react";
import {
  Box,
  Stack,
  HStack,
  Icon,
  Image,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import { MENU_ITEMS } from "@/utils/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DesktopSidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isOpen,
  setIsOpen,
}) => {
  return (
    <Box
      w={isOpen ? "250px" : "80px"}
      h="100vh"
      bg="rgba(255,255,255,0.08)"
      p={4}
      pos="fixed"
      display="flex"
      flexDirection="column"
      borderRight="1px solid rgba(255,255,255,0.2)"
      transition="width 0.3s ease"
      overflow="hidden"
      zIndex={10}
      color="white"
      boxShadow="0 8px 24px rgba(255,165,0,0.15)"
      backdropFilter="blur(10px)"
    >
      {/* Header */}
      <HStack mb={10} justifyContent={isOpen ? "space-between" : "center"}>
        {isOpen && (
          <NavLink to="/">
            <Image
              src="/Logo VISMED Official.png"
              alt="VISMED Logo"
              maxW="90px"
              h="auto"
              objectFit="contain"
              userSelect="none"
            />
          </NavLink>
        )}

        <IconButton
          aria-label="Toggle sidebar"
          size="sm"
          variant="ghost"
          color="white"
          bg="rgba(255,255,255,0.15)"
          _hover={{ bg: "rgba(255,165,0,0.2)" }}
          _focus={{ boxShadow: "none" }}
          borderRadius="full"
          border="1px solid rgba(255,255,255,0.2)"
          backdropFilter="blur(10px)"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? (
            <ChevronLeft size={20} color="white" />
          ) : (
            <ChevronRight size={20} color="white" />
          )}
        </IconButton>
      </HStack>

      {/* Logo saat sidebar tertutup */}
      {!isOpen && (
        <Box mb={10} textAlign="center">
          <NavLink to="/">
            <Image
              src="/Logo VISMED Official.png"
              alt="VISMED Logo"
              maxW="50px"
              h="auto"
              mx="auto"
              objectFit="contain"
              userSelect="none"
              transition="max-width 0.3s ease"
            />
          </NavLink>
        </Box>
      )}

      {/* Menu */}
      <Stack align="stretch" gap={2} direction="column" flex={1}>
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              textDecoration: "none",
              backgroundColor: isActive
                ? "rgba(255,165,0,0.25)"
                : "transparent",
              borderRadius: "8px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: isOpen ? "flex-start" : "center",
              transition: "background-color 0.2s ease",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
            })}
            className="sidebar-link"
          >
            <HStack gap={isOpen ? 3 : 0} w="100%">
              <Icon as={item.icon} boxSize={5} color="white" />
              {isOpen && (
                <Text
                  color="white"
                  fontWeight="bold"
                  transition="opacity 0.2s ease"
                >
                  {item.label}
                </Text>
              )}
            </HStack>
          </NavLink>
        ))}
      </Stack>

      <style>
        {`
          .sidebar-link:hover {
            background-color: rgba(255,165,0,0.2) !important;
            border-radius: 8px;
          }
        `}
      </style>
    </Box>
  );
};

export default React.memo(DesktopSidebar);
