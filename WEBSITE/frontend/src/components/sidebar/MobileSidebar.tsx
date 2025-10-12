import React from "react";
import {
  VStack,
  HStack,
  Icon,
  IconButton,
  useDisclosure,
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerBody,
  DrawerCloseTrigger,
  Image,
  Text,
} from "@chakra-ui/react";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { MENU_ITEMS } from "@/utils/constants";

const MobileSidebar: React.FC = () => {
  const { open, onOpen, onClose } = useDisclosure();

  return (
    <>
      {/* Toggle Button (Hamburger) */}
      <IconButton
        aria-label="Toggle Menu"
        variant="ghost"
        bg="transparent"
        _hover={{ bg: "rgba(255,165,0,0.2)" }}
        _active={{ bg: "rgba(255,165,0,0.3)" }}
        _focus={{ boxShadow: "none" }}
        display={{ base: "block", md: "none" }}
        pos="fixed"
        top={4}
        left={4}
        zIndex={2000}
        onClick={onOpen}
      >
        <Menu size={26} strokeWidth={3} color="white" />
      </IconButton>

      {/* Drawer */}
      <DrawerRoot
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
        placement="start"
        size="xs"
      >
        {/* Backdrop */}
        <DrawerBackdrop
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          zIndex={1999}
          bg="rgba(0,0,0,0.5)"
          backdropFilter="blur(5px)"
          onClick={onClose}
        />

        {/* Sidebar */}
        <DrawerContent
          position="fixed"
          top={0}
          left={0}
          bg="rgba(255,255,255,0.08)"
          maxW="200px"
          h="100vh"
          display="flex"
          flexDirection="column"
          zIndex={2000}
          color="white"
          borderRight="1px solid rgba(255,255,255,0.2)"
          boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          backdropFilter="blur(10px)"
        >
          <DrawerCloseTrigger
            asChild
            pos="absolute"
            top={3}
            right={2}
            zIndex={2001}
          >
            <IconButton
              aria-label="Close Menu"
              variant="ghost"
              bg="transparent"
              _hover={{ bg: "rgba(255,165,0,0.2)" }}
              _active={{ bg: "rgba(255,165,0,0.3)" }}
              _focus={{ boxShadow: "none" }}
              onClick={onClose}
            >
              <X size={24} strokeWidth={3} color="white" />
            </IconButton>
          </DrawerCloseTrigger>

          <DrawerBody p={4} pt={3} overflowY="auto" flex="1">
            {/* Logo + Menu Items dalam VStack */}
            <VStack align="stretch" gap={4}>
              {/* Logo sejajar kiri */}
              <HStack mb={2} mt={-3}>
                <NavLink to="/" onClick={onClose}>
                  <Image
                    src="/Logo VISMED Official.png"
                    alt="VISMED Logo"
                    boxSize="60px"
                    objectFit="contain"
                  />
                </NavLink>
              </HStack>

              {/* Menu Items */}
              <VStack align="stretch" gap={3}>
                {MENU_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      backgroundColor: isActive
                        ? "rgba(255,165,0,0.25)"
                        : "transparent",
                      borderRadius: "8px",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "white",
                      fontWeight: "bold",
                      transition: "background-color 0.2s ease",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(10px)",
                    })}
                    className="mobile-sidebar-link"
                  >
                    <Icon as={item.icon} boxSize={5} color="white" />
                    <Text>{item.label}</Text>
                  </NavLink>
                ))}
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>

      <style>
        {`
          .mobile-sidebar-link:hover {
            background-color: rgba(255,165,0,0.2) !important;
            border-radius: 8px;
          }
        `}
      </style>
    </>
  );
};

export default React.memo(MobileSidebar);
