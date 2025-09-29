// src/pages/FindYourVISMED.tsx
import { useEffect, useRef } from "react";
import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import { FiMapPin, FiMap } from "react-icons/fi";
import PageTransition from "@/components/layouts/PageTransition";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

declare global {
  interface Window {
    google: any;
  }
}

const FindYourVISMED = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Lokasi default (jika belum ada lokasi dari ESP32)
  const defaultLocation = {
    lat: -7.919596235477069,
    lng: 112.59541158001561,
  };

  // =========================
  // Leaflet setup
  // =========================
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [defaultLocation.lat, defaultLocation.lng],
        15
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // marker awal
      markerRef.current = L.marker([defaultLocation.lat, defaultLocation.lng])
        .addTo(mapRef.current)
        .bindPopup("Lokasi VISMED")
        .openPopup();
    }
  }, []);

  // =========================
  // Fetch lokasi realtime tiap 5 detik
  // =========================
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/maps");
        const data = await res.json();

        if (data.ok && mapRef.current && markerRef.current) {
          const { lat, lng } = data.location;

          // update marker
          markerRef.current.setLatLng([lat, lng]);

          // fokus peta
          mapRef.current.setView([lat, lng]);
        }
      } catch (err) {
        console.error("❌ Gagal fetch lokasi VISMED:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🔔 Trigger bel (panggil API backend)
  const handleBell = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/bell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioPath: "halo-vismed-disini.mp3" }),
      });

      if (!res.ok) throw new Error("Gagal trigger bel");

      const data = await res.json();
      console.log("✅ Bell response:", data);
    } catch (err) {
      console.error("❌ Gagal trigger bel:", err);
    }
  };

  // 🚗 Ambil arah dengan lokasi user sekarang
  const handleDirection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${
            markerRef.current?.getLatLng().lat
          },${markerRef.current?.getLatLng().lng}&travelmode=driving`;
          window.open(gmapsUrl, "_blank");
        },
        (err) => {
          console.error("Gagal ambil lokasi user", err);
          alert("Tidak bisa ambil lokasi Anda. Pastikan GPS aktif.");
        }
      );
    } else {
      alert("Browser Anda tidak mendukung Geolocation.");
    }
  };

  // 🎯 Fokuskan peta ke marker terakhir
  const handleLocation = () => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView(markerRef.current.getLatLng(), 15);
    }
  };

  return (
    <PageTransition>
      <Flex
        direction="column"
        minH="100dvh"
        maxH="100dvh"
        w="100%"
        bg="#242424"
        p={{ base: 2, md: 4 }}
        overflow="hidden"
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
          mb={{ base: 3, md: 5 }}
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
