// src/pages/FindYourVISMED.tsx
import { useEffect, useRef } from "react";
import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import { FiMapPin, FiMap } from "react-icons/fi";
import PageTransition from "@/components/layouts/PageTransition";
import { loadGoogleMaps } from "@/utils/loadGoogleMaps";

declare global {
  interface Window {
    google: any;
  }
}

const FindYourVISMED = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const alatLocation = {
    lat: -7.919596235477069,
    lng: 112.59541158001561,
  };

  useEffect(() => {
    loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_KEY).then(() => {
      if (mapContainerRef.current && !mapRef.current) {
        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: alatLocation,
          zoom: 15,
        });

        new window.google.maps.Marker({
          position: alatLocation,
          map: mapRef.current,
          title: "Lokasi VISMED",
        });
      }
    });
  }, []);

  const handleBell = async () => {
    try {
      await fetch("http://localhost:5000/api/bell", { method: "POST" });
      alert("🔔 Bel ditekan, cek ESP32!");
    } catch (err) {
      console.error("Gagal trigger bel", err);
    }
  };

  const handleDirection = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/maps/directions?origin=Malang&destination=Batu"
      );
      const data = await res.json();
      console.log("Directions API Response:", data);
      alert("🚗 Directions berhasil diambil, cek console.log");
    } catch (err) {
      console.error("Gagal ambil directions", err);
    }
  };

  const handleLocation = () => {
    if (mapRef.current) {
      mapRef.current.setCenter(alatLocation);
      mapRef.current.setZoom(15);
    }
  };

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

        {/* Maps */}
        <Box
          ref={mapContainerRef}
          flex="1"
          bg="gray.300"
          m={{ base: 2, md: 4 }}
          borderRadius="2xl"
          fontSize={{ base: "sm", md: "lg" }}
          color="black"
        />

        {/* Bottom Buttons */}
        <Flex
          p={{ base: 3, md: 4 }}
          bg="#2f2f2f"
          borderRadius="2xl"
          borderTop="4px solid"
          borderColor="gray.600"
          justify="space-between"
          align="center"
        >
          {/* Direction */}
          <Box
            onClick={handleDirection}
            flex="1"
            mx={1}
            bg="teal.600"
            color="white"
            textAlign="center"
            py={{ base: 3, md: 4 }}
            borderRadius="xl"
            cursor="pointer"
            transition="0.2s"
            _hover={{ bg: "teal.700" }}
          >
            <VStack gap={1}>
              <FiMap size={20} />
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                Direction
              </Text>
            </VStack>
          </Box>

          {/* Bell */}
          <Box
            onClick={handleBell}
            flex="1"
            mx={1}
            bg="#445775"
            color="white"
            textAlign="center"
            py={{ base: 3, md: 4 }}
            borderRadius="xl"
            cursor="pointer"
            transition="0.2s"
            _hover={{ bg: "#5a6f91" }}
          >
            <VStack gap={1}>
              <Text fontSize={{ base: "lg", md: "xl" }}>🔔</Text>
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                Bell
              </Text>
            </VStack>
          </Box>

          {/* Location */}
          <Box
            onClick={handleLocation}
            flex="1"
            mx={1}
            bg="purple.600"
            color="white"
            textAlign="center"
            py={{ base: 3, md: 4 }}
            borderRadius="xl"
            cursor="pointer"
            transition="0.2s"
            _hover={{ bg: "purple.700" }}
          >
            <VStack gap={1}>
              <FiMapPin size={20} />
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                Location
              </Text>
            </VStack>
          </Box>
        </Flex>
      </Flex>
    </PageTransition>
  );
};

export default FindYourVISMED;
