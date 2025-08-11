import React from "react";
import {
  VStack,
  Icon,
  IconButton,
  useDisclosure,
  Drawer,
} from "@chakra-ui/react";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

const MobileSidebar: React.FC = () => {
  const { open, onOpen, onClose } = useDisclosure();

  return (
    <>
      {/* Tombol untuk membuka menu */}
      <IconButton
        aria-label="Toggle Menu"
        variant="ghost"
        display={{ base: "block", md: "none" }}
        pos="fixed"
        top={4}
        left={4}
        zIndex={10}
        onClick={onOpen}
      >
        <Icon as={Menu} boxSize={5} />
      </IconButton>

      {/* Drawer untuk navigasi mobile */}
      <Drawer.Root
        open={open}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        placement="start"
      >
        <Drawer.Backdrop />
        <Drawer.Content>
          <Drawer.Body p={4}>
            <VStack align="stretch" gap={4}>
              <NavLink to="/" onClick={onClose}>
                Home
              </NavLink>
              <NavLink to="/about" onClick={onClose}>
                About
              </NavLink>
              <NavLink to="/dashboard" onClick={onClose}>
                Dashboard
              </NavLink>
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
};

export default React.memo(MobileSidebar);
