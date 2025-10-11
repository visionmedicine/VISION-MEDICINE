import { Box } from "@chakra-ui/react";

const Footer: React.FC = () => {
  return (
    <Box
      as="footer"
      mt="auto"
      py={2}
      bg="rgba(255, 255, 255, 0.07)" // transparan biar nyatu sama background
      backdropFilter="blur(6px)"
      color="white"
      fontSize="12px"
      w="100%"
      px={{ base: 4, md: 6 }}
      borderTop="1px solid"
      borderColor="rgba(255,255,255,0.1)"
      position="relative"
      display="flex"
      justifyContent={{ base: "center", md: "flex-end" }}
      alignItems="center"
      textAlign="center"
    >
      © 2025 Vision Medicine. All rights reserved.
    </Box>
  );
};

export default Footer;
