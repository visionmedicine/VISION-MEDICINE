// LiveStream.tsx
import { Box, Heading, Text, Flex, Button } from "@chakra-ui/react";
import { keyframes, css } from "@emotion/react";
import { useState } from "react";
import PageTransition from "@/components/layouts/PageTransition";

// URL backend stream (dari env)
const streamUrl = import.meta.env.VITE_BACKEND_URL + "/api/livestream/video";

// Animasi glitch ala TV rusak
const glitch = keyframes`
  0% { clip-path: inset(20% 0 30% 0); transform: skew(0.5deg); }
  10% { clip-path: inset(15% 0 40% 0); transform: skew(-0.5deg); }
  20% { clip-path: inset(40% 0 15% 0); transform: skew(0.8deg); }
  30% { clip-path: inset(25% 0 20% 0); transform: skew(-0.8deg); }
  40% { clip-path: inset(10% 0 35% 0); transform: skew(0.3deg); }
  50% { clip-path: inset(35% 0 10% 0); transform: skew(-0.3deg); }
  60% { clip-path: inset(20% 0 25% 0); transform: skew(1deg); }
  70% { clip-path: inset(30% 0 20% 0); transform: skew(-1deg); }
  80% { clip-path: inset(15% 0 30% 0); transform: skew(0.6deg); }
  90% { clip-path: inset(25% 0 15% 0); transform: skew(-0.6deg); }
  100% { clip-path: inset(20% 0 30% 0); transform: skew(0.5deg); }
`;

// Styling khusus glitch gambar fallback
const glitchStyle = css`
  animation: ${glitch} 1s infinite;
  filter: contrast(200%) brightness(150%) saturate(200%);
`;

// Animasi kedip untuk teks "NO SIGNAL"
const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 99% { opacity: 0; }
  100% { opacity: 1; }
`;

const blinkStyle = css`
  animation: ${blink} 1s step-start infinite;
`;

export default function LiveStream() {
  const [isFallback, setIsFallback] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleImgError = () => {
    setIsFallback(true);
  };

  const handleConnect = () => {
    setIsFallback(false);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsFallback(false);
  };

  return (
    <PageTransition>
      <Box p={6} pt={3} minH="100vh">
        {/* Heading selalu di atas */}
        <Flex direction="column" align="center" mb={6}>
          <Heading size="2xl">Live Stream Detection</Heading>
        </Flex>

        {!isConnected ? (
          // ⬇️ Tampilan saat belum connect
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="70vh"
            textAlign="center"
            gap={4}
          >
            <Button
              size="lg"
              colorScheme="orange"
              borderRadius="full"
              px={10}
              py={6}
              fontWeight="bold"
              onClick={handleConnect}
              shadow="md"
            >
              CONNECT
            </Button>
            <Text fontSize="sm" color="gray.400" mt={1}>
              Klik tombol Connect untuk memulai Live Streaming 📡
            </Text>
          </Flex>
        ) : (
          // ⬇️ Tampilan setelah connect
          <Flex direction="column" align="center" gap={4}>
            {/* Stream box */}
            <Box
              mt={1}
              border="4px solid orange"
              borderRadius="md"
              overflow="hidden"
              w="100%"
              maxW="100%"
              mx="auto"
              position="relative"
              bg="black"
            >
              <img
                src={isFallback ? "/no-signal.png" : streamUrl}
                className={isFallback ? glitchStyle.toString() : ""}
                style={{
                  width: "100%",
                  height: "70vh", // balik ke tinggi fix
                  objectFit: "contain", // biar proporsional (beda dengan cover yg bisa crop)
                  display: "block",
                  margin: "0 auto",
                  backgroundColor: "black",
                }}
                onError={handleImgError}
              />

              {isFallback && (
                <Flex
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  align="center"
                  justify="center"
                  bg="rgba(0,0,0,0.3)"
                >
                  <Heading
                    size="lg"
                    color="white"
                    textAlign="center"
                    fontWeight="bold"
                    textShadow="2px 2px 6px rgba(0,0,0,0.9)"
                    className={blinkStyle.toString()}
                  >
                    NO SIGNAL
                  </Heading>
                </Flex>
              )}
            </Box>

            {/* Tombol Disconnect */}
            <Box mt={1}>
              <Button
                size="lg"
                colorScheme="red"
                borderRadius="full"
                px={10}
                py={6}
                fontWeight="bold"
                onClick={handleDisconnect}
                shadow="md"
              >
                DISCONNECT
              </Button>
            </Box>

            {/* Caption bawah */}
            <Text fontSize="sm" color="gray.400" mt={1} textAlign="center">
              Live Streaming diambil dari kamera yang terhubung ke VISMED
              Raspberry Pi 5 ‼️
            </Text>
          </Flex>
        )}
      </Box>
    </PageTransition>
  );
}
