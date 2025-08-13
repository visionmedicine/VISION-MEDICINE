import { Box } from "@chakra-ui/react";

const Footer: React.FC = () => {
  return (
    <Box
      as="footer"
      mt="auto"
      py={2}
      bg="gray.300"
      color="black"
      fontSize="12px"
      w="100%"
      px={{ base: 4, md: 6 }}
      borderTop="1px solid"
      borderColor="gray.300"
      zIndex={-1}
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
