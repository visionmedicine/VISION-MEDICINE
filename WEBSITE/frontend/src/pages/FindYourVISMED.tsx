// src/pages/FindYourVISMED.tsx
import { useEffect, useRef } from "react";
import { Box, Flex, Text, VStack, HStack, Heading } from "@chakra-ui/react";
import { FiMapPin, FiMap, FiBell, FiCrosshair } from "react-icons/fi";
import PageTransition from "@/components/layouts/PageTransition";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// =========================
// Fix path marker Leaflet
// =========================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/assets/leaflet/images/marker-icon-2x.png",
  iconUrl: "/assets/leaflet/images/marker-icon.png",
  shadowUrl: "/assets/leaflet/images/marker-shadow.png",
});

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
        w="100%"
        p={{ base: 3, md: 5 }}
        color="white"
        position="relative"
        overflow="hidden"
        justify="flex-start"
        pt={{ base: 4, md: 6 }} // 🔼 konten agak ke atas
      >
        {/* Header dengan gaya glassmorphism */}
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          borderRadius="2xl"
          p={{ base: 5, md: 6 }}
          mb={6}
          bg="rgba(255, 255, 255, 0.15)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.25)"
          backdropFilter="blur(14px) saturate(180%)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          transition="all 0.3s ease"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "0 12px 36px rgba(255,165,0,0.25)",
          }}
          mt={{ base: -1, md: -2 }} // 🔼 dinaikkan sedikit
        >
          <HStack justify="center" gap={3}>
            <FiMapPin size={28} color="#FFA500" />
            <Heading
              fontSize={{ base: "2xl", md: "3xl" }}
              bgGradient="linear(to-r, orange.300, yellow.400)"
              bgClip="text"
              fontWeight="extrabold"
              letterSpacing="wide"
              color="rgba(255,255,255,0.85)"
            >
              Find Your VISMED
            </Heading>
          </HStack>
          <Text
            mt={3}
            fontSize={{ base: "md", md: "lg" }}
            textAlign="center"
            color="rgba(255,255,255,0.85)"
            maxW="90%"
          >
            Temukan lokasi Vision Medicine secara real-time di peta interaktif
          </Text>
        </Box>

        {/* Peta */}
        <Box
          ref={mapContainerRef}
          flex="1"
          borderRadius="2xl"
          border="1px solid rgba(255,255,255,0.15)"
          boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          backdropFilter="blur(10px)"
          overflow="hidden"
          bg="rgba(255,255,255,0.08)"
          position="relative"
          mt={{ base: -1, md: -2 }} // 🔼 peta agak dinaikkan
        />

        {/* Tombol kontrol bawah */}
        <Flex
          mt={{ base: 3, md: 4 }} // 🔼 jarak bawah dikurangi agar naik sedikit
          mb={{ base: 2, md: 3 }} // 🔼 beri sedikit margin bawah supaya tidak terlalu ke tepi layar
          bg="rgba(255,255,255,0.12)"
          backdropFilter="blur(16px)"
          border="1px solid rgba(255,255,255,0.15)"
          borderRadius="2xl"
          boxShadow="0 8px 24px rgba(255,165,0,0.2)"
          p={{ base: 3, md: 4 }}
          justify="space-around"
          align="center"
          flexWrap="wrap"
          gap={3}
        >
          {/* Direction */}
          <Box
            onClick={handleDirection}
            flex="1"
            minW="100px"
            mx={1}
            textAlign="center"
            py={{ base: 3, md: 4 }}
            borderRadius="xl"
            cursor="pointer"
            bg="rgba(255,165,0,0.25)"
            _hover={{
              transform: "scale(1.05)",
              boxShadow: "0 8px 24px rgba(255,165,0,0.3)",
            }}
            transition="all 0.2s ease"
          >
            <VStack gap={1}>
              <FiMap size={22} />
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                Direction
              </Text>
            </VStack>
          </Box>

          {/* Bell */}
          <Box
            onClick={handleBell}
            flex="1"
            minW="100px"
            mx={1}
            textAlign="center"
            py={{ base: 3, md: 4 }}
            borderRadius="xl"
            cursor="pointer"
            bg="rgba(68,87,117,0.6)"
            _hover={{
              transform: "scale(1.05)",
              boxShadow: "0 8px 24px rgba(255,165,0,0.3)",
              bg: "rgba(68,87,117,0.8)",
            }}
            transition="all 0.2s ease"
          >
            <VStack gap={1}>
              <FiBell size={22} />
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                Bell
              </Text>
            </VStack>
          </Box>

          {/* Location */}
          <Box
            onClick={handleLocation}
            flex="1"
            minW="100px"
            mx={1}
            textAlign="center"
            py={{ base: 3, md: 4 }}
            borderRadius="xl"
            cursor="pointer"
            bg="rgba(128,90,213,0.3)"
            _hover={{
              transform: "scale(1.05)",
              boxShadow: "0 8px 24px rgba(255,165,0,0.3)",
              bg: "rgba(128,90,213,0.4)",
            }}
            transition="all 0.2s ease"
          >
            <VStack gap={1}>
              <FiCrosshair size={22} />
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
