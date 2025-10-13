// src/pages/MedicineInformation.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Box,
  Flex,
  Input,
  IconButton,
  Text,
  HStack,
  SimpleGrid,
  Heading,
  Icon,
} from "@chakra-ui/react";
import { Collapse } from "@chakra-ui/transition";
import { keyframes } from "@emotion/react";
import {
  FaPills,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaMicrophone,
} from "react-icons/fa";
import PageTransition from "@/components/layouts/PageTransition";

interface Medicine {
  name: string;
  kandungan: string;
  indikasi: string;
  efekSamping: string;
  dosis: string;
  golongan: string;
}

// Normalisasi string (case-insensitive, hilangkan spasi ekstra, aksen)
const normalize = (s: string) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

// Capitalize setiap awal kata
const capitalizeWords = (s: string) =>
  s.replace(/\b\w/g, (char) => char.toUpperCase());

// Keyframes animasi wavy loader (Emotion)
const wave = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
`;

const MedicineInformation = () => {
  const [input, setInput] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [openStatesLeft, setOpenStatesLeft] = useState<Record<string, boolean>>(
    {}
  );
  const [openStatesRight, setOpenStatesRight] = useState<
    Record<string, boolean>
  >({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Init Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID"; // bahasa Indonesia
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("❌ Speech recognition error:", event.error);
        setListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition tidak didukung di browser ini 😢");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Di MedicineInformation.tsx, ganti fetch:
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/medicines`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`); // Handle 404 better
        const data: Medicine[] = await res.json();
        const sorted = data
          .filter((m) => !!m?.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setMedicines(sorted);
      } catch (error) {
        console.error("❌ Error fetching medicines:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  // Filter: hanya berdasarkan nama obat, fleksibel substring
  const filteredMedicines = useMemo(() => {
    const q = normalize(input);
    if (!q) return medicines;
    return medicines.filter((med) => normalize(med.name).includes(q));
  }, [input, medicines]);

  const handleReset = () => {
    setInput("");
    setOpenStatesLeft({});
    setOpenStatesRight({});
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const toggleDropdown = (keyId: string, column: "left" | "right") => {
    if (column === "left") {
      setOpenStatesLeft((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
    } else {
      setOpenStatesRight((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
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
        pt={{ base: 4, md: 6 }}
      >
        {/* Header dengan gaya glassmorphism */}
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          w="full"
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
          mt={{ base: 0, md: -2 }}
        >
          <Flex
            justify="center"
            align="center"
            gap={3}
            flexWrap="wrap"
            w="full"
          >
            <Icon as={FaPills} boxSize={{ base: 6, md: 10 }} color="#FFA500" />
            <Heading
              textAlign="center"
              fontSize={{ base: "2xl", md: "3xl" }}
              bgGradient="linear(to-r, orange.300, yellow.400)"
              bgClip="text"
              fontWeight="extrabold"
              letterSpacing="wide"
              color="rgba(255,255,255,0.85)"
              w="auto"
            >
              Medicine Information
            </Heading>
          </Flex>
          <Text
            mt={3}
            fontSize={{ base: "md", md: "lg" }}
            textAlign="center"
            color="rgba(255,255,255,0.85)"
            maxW="90%"
          >
            Cari informasi obat dengan cepat
          </Text>
        </Box>

        {/* Medicine List */}
        <Box
          ref={containerRef}
          flex="1"
          borderRadius="2xl"
          border="1px solid rgba(255,255,255,0.15)"
          boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          backdropFilter="blur(10px)"
          overflow="hidden"
          bg="rgba(255,255,255,0.08)"
          position="relative"
          mb={4}
          p={{ base: 3, md: 4 }}
          maxH="calc(100vh - 300px)"
          overflowY="auto"
        >
          {loading ? (
            <Flex
              justify="center"
              align="center"
              w="100%"
              minH="calc(100vh - 300px)"
              gap={2}
              role="status"
              aria-label="Memuat data obat"
              color="white"
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  w="12px"
                  h="12px"
                  borderRadius="full"
                  bg="#FFA500"
                  animation={`${wave} 1s ease-in-out infinite`}
                  animationDelay={`${i * 0.2}s`}
                />
              ))}
            </Flex>
          ) : filteredMedicines.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {filteredMedicines.map((med, index) => {
                const column = index % 2 === 0 ? "left" : "right";
                const keyId = `${med.name}-${index}`;
                const isOpen =
                  column === "left"
                    ? openStatesLeft[keyId]
                    : openStatesRight[keyId];

                return (
                  <Box
                    key={keyId}
                    bg="rgba(255,255,255,0.08)"
                    color="white"
                    px={{ base: 3, md: 4 }}
                    py={{ base: 3, md: 3 }}
                    borderRadius="xl"
                    boxShadow="sm"
                    display="flex"
                    flexDirection="column"
                    transition="all 0.2s"
                    border="1px solid rgba(255,255,255,0.2)"
                    backdropFilter="blur(10px)"
                    _hover={{
                      boxShadow: "0 8px 24px rgba(255,165,0,0.25)",
                      transform: "translateY(-2px)",
                    }}
                  >
                    <HStack
                      cursor="pointer"
                      justify="space-between"
                      borderBottom={
                        isOpen ? "1px solid rgba(255,255,255,0.2)" : "none"
                      }
                      onClick={() => toggleDropdown(keyId, column)}
                      mb={isOpen ? 3 : 0}
                    >
                      <Text
                        fontWeight="bold"
                        fontSize={{ base: "sm", md: "md" }}
                      >
                        {capitalizeWords(med.name)}
                      </Text>
                      {isOpen ? (
                        <FaChevronUp color="#FFA500" />
                      ) : (
                        <FaChevronDown color="#FFA500" />
                      )}
                    </HStack>

                    <Collapse in={isOpen} animateOpacity>
                      <Box fontSize={{ base: "sm", md: "md" }}>
                        <Text mb={2}>
                          <strong>Kandungan:</strong> {med.kandungan}
                        </Text>
                        <Text mb={2}>
                          <strong>Indikasi:</strong> {med.indikasi}
                        </Text>
                        <Text mb={2}>
                          <strong>Dosis:</strong> {med.dosis}
                        </Text>
                        <Text mb={2}>
                          <strong>Efek Samping:</strong> {med.efekSamping}
                        </Text>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </SimpleGrid>
          ) : (
            <Flex
              justify="center"
              align="center"
              w="100%"
              minH="calc(100vh - 300px)"
            >
              <Text
                color="rgba(255,255,255,0.85)"
                textAlign="center"
                fontSize={{ base: "md", md: "lg" }}
              >
                Tidak ada obat ditemukan.
              </Text>
            </Flex>
          )}
        </Box>

        {/* Input Area */}
        <Box
          borderTop="1px solid rgba(255,255,255,0.15)"
          p={{ base: 3, md: 4 }}
          bg="rgba(255,255,255,0.12)"
          backdropFilter="blur(16px)"
          border="1px solid rgba(255,255,255,0.15)"
          borderRadius="2xl"
          boxShadow="0 8px 24px rgba(255,165,0,0.2)"
          position="relative"
          zIndex={100}
        >
          {/* Mic button */}
          <IconButton
            aria-label="Mic"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme={listening ? "red" : "orange"}
            position="absolute"
            left={{ base: "10px", md: "20px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
            onClick={handleMicClick}
            bg="transparent"
            _hover={{ bg: "rgba(255,165,0,0.2)" }}
            _active={{ bg: "rgba(255,165,0,0.3)" }}
            _focus={{ boxShadow: "none", bg: "rgba(255,165,0,0.2)" }}
          >
            <FaMicrophone size={18} />
          </IconButton>

          {/* Input */}
          <Input
            placeholder="Cari nama obat..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            pl={{ base: "40px", md: "50px" }}
            pr={{ base: "35px", md: "40px" }}
            color="black"
            bg="rgba(255,255,255,0.9)"
            borderRadius="2xl"
            fontSize={{ base: "sm", md: "md" }}
            border="1px solid rgba(255,255,255,0.3)"
            _placeholder={{ color: "gray.500" }}
            _focus={{ boxShadow: "0 0 0 1px rgba(255,165,0,0.5)" }}
          />

          {/* Reset button */}
          <IconButton
            aria-label="Reset"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme="orange"
            onClick={handleReset}
            position="absolute"
            right={{ base: "10px", md: "20px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
            bg="transparent"
            _hover={{ bg: "rgba(255,165,0,0.2)" }}
            _active={{ bg: "rgba(255,165,0,0.3)" }}
            _focus={{ boxShadow: "none", bg: "rgba(255,165,0,0.2)" }}
          >
            <FaTimes size={18} />
          </IconButton>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default MedicineInformation;
