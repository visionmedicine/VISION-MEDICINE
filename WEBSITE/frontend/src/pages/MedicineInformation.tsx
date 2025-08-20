// src/pages/MedicineInformation.tsx
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  IconButton,
  Text,
  HStack,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { Collapse } from "@chakra-ui/transition";
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

const MedicineInformation = () => {
  const [input, setInput] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [openStatesLeft, setOpenStatesLeft] = useState<{
    [key: string]: boolean;
  }>({});
  const [openStatesRight, setOpenStatesRight] = useState<{
    [key: string]: boolean;
  }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch dari backend
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/medicines");
        const data: Medicine[] = await res.json();
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setMedicines(sorted);
        setFilteredMedicines(sorted);
      } catch (error) {
        console.error("❌ Error fetching medicines:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  // Filter search
  useEffect(() => {
    if (!input.trim()) {
      setFilteredMedicines(medicines);
      if (containerRef.current) containerRef.current.scrollTop = 0;
      return;
    }
    const filtered = medicines.filter(
      (med) =>
        med.name.toLowerCase().includes(input.toLowerCase()) ||
        med.kandungan.toLowerCase().includes(input.toLowerCase()) ||
        med.indikasi.toLowerCase().includes(input.toLowerCase()) ||
        med.efekSamping.toLowerCase().includes(input.toLowerCase()) ||
        med.dosis.toLowerCase().includes(input.toLowerCase()) ||
        med.golongan.toLowerCase().includes(input.toLowerCase())
    );
    setFilteredMedicines(filtered);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [input, medicines]);

  const handleReset = () => {
    setInput("");
    setFilteredMedicines(medicines);
    setOpenStatesLeft({});
    setOpenStatesRight({});
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const toggleDropdown = (name: string, column: "left" | "right") => {
    if (column === "left") {
      setOpenStatesLeft((prev) => ({ ...prev, [name]: !prev[name] }));
    } else {
      setOpenStatesRight((prev) => ({ ...prev, [name]: !prev[name] }));
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
            <Flex justify="center" align="center" h="full">
              <Spinner size="xl" color="white" />
            </Flex>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((med, index) => {
                  const column = index % 2 === 0 ? "left" : "right";
                  const isOpen =
                    column === "left"
                      ? openStatesLeft[med.name]
                      : openStatesRight[med.name];

                  return (
                    <Box
                      key={med.name}
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
                        onClick={() => toggleDropdown(med.name, column)}
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
          borderRadius="2xl"
          boxShadow="md"
          position="relative"
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
            placeholder="Cari obat, kegunaan, atau efek samping..."
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
