import React from "react";
import {
  VStack,
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
        _hover={{ bg: "transparent" }}
        _active={{ bg: "transparent" }}
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
        {/* Backdrop tetap fixed */}
        <DrawerBackdrop
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          zIndex={1999}
          onClick={onClose}
        />

        {/* Sidebar tetap fixed */}
        <DrawerContent
          position="fixed"
          top={0}
          left={0}
          bg="white"
          maxW="260px"
          h="100vh"
          display="flex"
          flexDirection="column"
          zIndex={2000}
        >
          <DrawerCloseTrigger
            asChild
            pos="absolute"
            top={3}
            right={3}
            zIndex={2001}
          >
            <IconButton
              aria-label="Close Menu"
              variant="ghost"
              bg="transparent"
              _hover={{ bg: "transparent" }}
              _active={{ bg: "transparent" }}
              _focus={{ boxShadow: "none" }}
              onClick={onClose}
            >
              <X size={24} strokeWidth={3} color="black" />
            </IconButton>
          </DrawerCloseTrigger>

          <DrawerBody p={4} pt={3} overflowY="auto" flex="1">
            {/* Logo agak naik */}
            <VStack mb={2} mt={-2}>
              <NavLink to="/" onClick={onClose}>
                <Image
                  src="/Logo VISMED Official.png"
                  alt="VISMED Logo"
                  maxW="100px"
                  boxSize="80px"
                  objectFit="contain"
                  mx="auto"
                />
              </NavLink>
            </VStack>

            {/* Menu Items */}
            <VStack align="stretch" gap={3}>
              {MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    textDecoration: "none",
                    backgroundColor: isActive ? "#E2E8F0" : "transparent",
                    borderRadius: "8px",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#1A202C",
                    fontWeight: "bold",
                  })}
                >
                  <Icon as={item.icon} boxSize={5} color="#1A202C" />
                  <Text>{item.label}</Text>
                </NavLink>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </>
  );
};

export default React.memo(MobileSidebar);
