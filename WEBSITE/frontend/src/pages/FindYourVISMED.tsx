// src/pages/FindYourVISMED.tsx
import { useRef } from "react";
import { Box, Flex, Text, HStack, SimpleGrid } from "@chakra-ui/react";
import { FiMapPin } from "react-icons/fi";
import PageTransition from "@/components/layouts/PageTransition";

const FindYourVISMED = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <PageTransition>
      <Flex
        direction="column"
        h="100vh"
        w="100%"
        bg="#242424"
        p={{ base: 2, md: 4 }}
      >
        {/* Header */}
        <Flex
          align="center"
          justify="center"
          bg="#2f2f2f"
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          borderBottom="4px solid"
          borderColor="gray.600"
          boxShadow="sm"
          borderRadius="2xl"
        >
          <HStack gap={2}>
            <FiMapPin size={24} color="white" />
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color="white"
            >
              Find Your VISMED
            </Text>
          </HStack>
        </Flex>

        {/* Maps Area */}
        <Box
          ref={mapContainerRef}
          flex="1"
          bg="gray.300"
          m={{ base: 2, md: 4 }}
          borderRadius="2xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize={{ base: "sm", md: "lg" }}
          color="black"
        >
          Maps Area (Google Maps API Here)
        </Box>

        {/* Bottom Buttons */}
        <Box
          p={{ base: 2, md: 3 }}
          bg="#2f2f2f"
          borderRadius="2xl"
          borderTop="4px solid"
          borderColor="gray.600"
        >
          <SimpleGrid columns={2} gap={3}>
            <Box
              bg="#445775"
              color="white"
              textAlign="center"
              py={{ base: 3, md: 4 }}
              borderRadius="xl"
              fontWeight="bold"
              fontSize={{ base: "md", md: "lg" }}
              cursor="pointer"
              transition="background-color 0.2s ease, color 0.2s ease"
              _hover={{
                bg: "#5a6f91",
                color: "whiteAlpha.900",
              }}
            >
              Bel
            </Box>
            <Box
              bg="#445775"
              color="white"
              textAlign="center"
              py={{ base: 3, md: 4 }}
              borderRadius="xl"
              fontWeight="bold"
              fontSize={{ base: "md", md: "lg" }}
              cursor="pointer"
              transition="background-color 0.2s ease, color 0.2s ease"
              _hover={{
                bg: "#5a6f91",
                color: "whiteAlpha.900",
              }}
            >
              Petunjuk
            </Box>
          </SimpleGrid>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default FindYourVISMED;
