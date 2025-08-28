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
} from "@chakra-ui/react";
import { Collapse } from "@chakra-ui/transition";
import { keyframes } from "@emotion/react";
import {
  FaPills,
  FaSearch,
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

// Keyframes animasi wavy loader (Emotion)
const wave = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
`;

const MedicineInformation = () => {
  const [input, setInput] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [openStatesLeft, setOpenStatesLeft] = useState<Record<string, boolean>>(
    {}
  );
  const [openStatesRight, setOpenStatesRight] = useState<
    Record<string, boolean>
  >({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch dari backend
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/medicines");
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
        minH="100dvh" // selalu setinggi viewport
        maxH="100dvh" // jangan lebih dari viewport
        w="100%"
        bg="#242424"
        p={{ base: 2, md: 4 }}
        overflow="hidden" // ⬅️ penting: cegah body ikut scroll
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
          borderRadius="2xl"
        >
          <HStack gap={2}>
            <FaPills size={24} color="white" />
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color="white"
            >
              Medicine Information
            </Text>
          </HStack>
        </Flex>

        {/* Medicine List */}
        <Box
          ref={containerRef}
          flex="1"
          overflowY="auto"
          p={{ base: 3, md: 4 }}
        >
          {loading ? (
            <Flex
              justify="center"
              align="center"
              h="full"
              gap={2}
              role="status"
              aria-label="Memuat data obat"
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  w="12px"
                  h="12px"
                  borderRadius="full"
                  bg="white"
                  animation={`${wave} 1s ease-in-out infinite`}
                  animationDelay={`${i * 0.2}s`}
                />
              ))}
            </Flex>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((med, index) => {
                  const column = index % 2 === 0 ? "left" : "right";
                  const keyId = `${med.name}-${index}`;
                  const isOpen =
                    column === "left"
                      ? openStatesLeft[keyId]
                      : openStatesRight[keyId];

                  return (
                    <Box
                      key={keyId}
                      bg="#445775"
                      color="white"
                      borderRadius="2xl"
                      boxShadow="md"
                      display="flex"
                      flexDirection="column"
                      transition="all 0.2s"
                      _hover={{
                        boxShadow: "lg",
                        transform: "translateY(-2px)",
                      }}
                    >
                      <HStack
                        px={{ base: 3, md: 4 }}
                        py={{ base: 2, md: 3 }}
                        cursor="pointer"
                        justify="space-between"
                        borderBottom={isOpen ? "1px solid" : "none"}
                        borderColor="gray.600"
                        onClick={() => toggleDropdown(keyId, column)}
                      >
                        <Text
                          fontWeight="bold"
                          fontSize={{ base: "sm", md: "md" }}
                        >
                          {med.name}
                        </Text>
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </HStack>

                      <Collapse in={isOpen} animateOpacity>
                        <Box
                          px={{ base: 3, md: 4 }}
                          py={{ base: 2, md: 3 }}
                          bg="gray.700"
                          borderRadius="0 0 2xl 2xl"
                          fontSize={{ base: "sm", md: "md" }}
                        >
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
                          <Text>
                            <strong>Golongan:</strong> {med.golongan}
                          </Text>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })
              ) : (
                <Text
                  color="white"
                  textAlign="center"
                  fontSize={{ base: "md", md: "lg" }}
                  gridColumn="span 2"
                >
                  Tidak ada obat ditemukan.
                </Text>
              )}
            </SimpleGrid>
          )}
        </Box>

        {/* Input Area */}
        <Box
          borderTop="4px solid"
          borderColor="gray.600"
          p={{ base: 2, md: 3 }}
          bg="#2f2f2f"
          position="sticky" // 🔥 bikin nempel bawah container
          bottom="0"
          borderRadius="2xl"
          zIndex={100} // biar selalu di atas chat scroll
        >
          <IconButton
            aria-label="Mic"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme="blue"
            position="absolute"
            left={{ base: "6px", md: "10px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
          >
            <FaMicrophone size={16} />
          </IconButton>

          <Input
            placeholder="Cari nama obat..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            pl={{ base: "35px", md: "40px" }}
            pr={{ base: "90px", md: "110px" }}
            color="black"
            bg="white"
            borderRadius="2xl"
            fontSize={{ base: "sm", md: "md" }}
          />

          <IconButton
            aria-label="Search"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme="blue"
            position="absolute"
            right={{ base: "35px", md: "50px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
          >
            <FaSearch size={18} />
          </IconButton>

          <IconButton
            aria-label="Reset"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme="blue"
            onClick={handleReset}
            position="absolute"
            right={{ base: "6px", md: "8px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
          >
            <FaTimes size={18} />
          </IconButton>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default MedicineInformation;
