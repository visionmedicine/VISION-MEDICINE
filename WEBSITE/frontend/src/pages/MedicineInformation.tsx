import { useState, useRef, useEffect } from "react";
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
import {
  FaPills,
  FaSearch,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface Medicine {
  name: string;
  use: string;
  dosage: string;
  sideEffects: string;
}

const MedicineInformation = () => {
  const [input, setInput] = useState("");
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScroll = useRef(true);

  const medicines: Medicine[] = [
    {
      name: "Amoxicillin",
      use: "Mengobati infeksi bakteri",
      dosage: "500 mg setiap 8 jam",
      sideEffects: "Diare, mual, alergi kulit",
    },
    {
      name: "Aspirin",
      use: "Meredakan nyeri ringan",
      dosage: "81-325 mg sekali sehari",
      sideEffects: "Iritasi lambung, perdarahan",
    },
    {
      name: "Atorvastatin",
      use: "Menurunkan kolesterol",
      dosage: "10-40 mg sekali sehari",
      sideEffects: "Nyeri otot, kerusakan hati",
    },
    {
      name: "Cefadroxil",
      use: "Infeksi bakteri pada kulit",
      dosage: "500 mg setiap 12 jam",
      sideEffects: "Mual, diare, reaksi alergi",
    },
    {
      name: "Cetirizine",
      use: "Meredakan gejala alergi",
      dosage: "10 mg sekali sehari",
      sideEffects: "Mengantuk, mulut kering",
    },
    {
      name: "Ciprofloxacin",
      use: "Infeksi saluran kemih",
      dosage: "500 mg setiap 12 jam",
      sideEffects: "Mual, diare, nyeri sendi",
    },
    {
      name: "Clopidogrel",
      use: "Mencegah pembekuan darah",
      dosage: "75 mg sekali sehari",
      sideEffects: "Perdarahan, memar",
    },
    {
      name: "Dexamethasone",
      use: "Mengurangi peradangan",
      dosage: "0.5-9 mg per hari",
      sideEffects: "Insomnia, nafsu makan meningkat",
    },
    {
      name: "Diazepam",
      use: "Mengatasi kecemasan",
      dosage: "2-10 mg 2-4 kali sehari",
      sideEffects: "Mengantuk, pusing",
    },
    {
      name: "Domperidone",
      use: "Mengatasi mual dan muntah",
      dosage: "10 mg 3 kali sehari",
      sideEffects: "Mulut kering, sakit kepala",
    },
  ].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setFilteredMedicines(medicines);
  }, []);

  const handleSearch = () => {
    if (!input.trim()) {
      setFilteredMedicines(medicines);
      setOpenStates({});
      return;
    }
    const filtered = medicines.filter(
      (med) =>
        med.name.toLowerCase().includes(input.trim().toLowerCase()) ||
        med.use.toLowerCase().includes(input.trim().toLowerCase()) ||
        med.sideEffects.toLowerCase().includes(input.trim().toLowerCase())
    );
    setFilteredMedicines(filtered);
    setInput("");
    setOpenStates({});
  };

  const handleReset = () => {
    setInput("");
    setFilteredMedicines(medicines);
    setOpenStates({});
  };

  const toggleDropdown = (index: number) => {
    setOpenStates((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const checkIfAtBottom = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 10;
  };

  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredMedicines, openStates]);

  return (
    <Flex direction="column" h="100vh" w="100%" bg="#242424" p={4}>
      {/* Header */}
      <Flex
        align="center"
        justify="center"
        bg="#2f2f2f"
        px={4}
        py={3}
        borderBottom="4px solid"
        borderColor="gray.600"
        borderRadius="2xl"
      >
        <HStack gap={2}>
          <FaPills size={24} color="white" />
          <Text fontSize="xl" fontWeight="bold" color="white">
            Medicine Information
          </Text>
        </HStack>
      </Flex>

      {/* Medicine List Area */}
      <Box
        ref={containerRef}
        flex="1"
        overflowY="auto"
        p={4}
        onScroll={checkIfAtBottom}
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {filteredMedicines.length > 0 ? (
            filteredMedicines.map((med, idx) => (
              <Box
                key={idx}
                bg="#445775"
                color="white"
                borderRadius="2xl"
                boxShadow="md"
                display="flex"
                flexDirection="column"
                transition="all 0.2s"
                _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
              >
                <HStack
                  px={4}
                  py={3}
                  cursor="pointer"
                  justify="space-between"
                  borderBottom={openStates[idx] ? "1px solid" : "none"}
                  borderColor="gray.600"
                  onClick={() => toggleDropdown(idx)}
                >
                  <Text fontWeight="bold">{med.name}</Text>
                  {openStates[idx] ? <FaChevronUp /> : <FaChevronDown />}
                </HStack>
                <Collapse in={openStates[idx]} animateOpacity>
                  <Box px={4} py={3} bg="gray.700" borderRadius="0 0 2xl 2xl">
                    <Text mb={2}>
                      <strong>Kegunaan:</strong> {med.use}
                    </Text>
                    <Text mb={2}>
                      <strong>Dosis:</strong> {med.dosage}
                    </Text>
                    <Text>
                      <strong>Efek Samping:</strong> {med.sideEffects}
                    </Text>
                  </Box>
                </Collapse>
              </Box>
            ))
          ) : (
            <Text
              color="white"
              textAlign="center"
              fontSize="lg"
              gridColumn="span 2"
            >
              Tidak ada obat ditemukan.
            </Text>
          )}
        </SimpleGrid>
      </Box>

      {/* Input Area */}
      <Box
        borderTop="4px solid"
        borderColor="gray.600"
        p={4}
        bg="#2f2f2f"
        borderRadius="2xl"
        boxShadow="md"
      >
        <HStack gap={3} position="relative">
          <IconButton
            aria-label="Mic"
            size="md"
            variant="ghost"
            colorScheme="blue"
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
          >
            <FaPills size={20} />
          </IconButton>
          <Input
            placeholder="Cari obat, kegunaan, atau efek samping..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            pl="40px"
            pr="96px"
            color="black"
            bg="white"
            borderRadius="2xl"
            fontSize="md"
            _focus={{
              borderColor: "blue.400",
              boxShadow: "0 0 0 1px blue.400",
            }}
          />
          <IconButton
            aria-label="Search"
            size="md"
            variant="ghost"
            colorScheme="blue"
            onClick={handleSearch}
            position="absolute"
            right="44px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
          >
            <FaSearch size={18} />
          </IconButton>
          <IconButton
            aria-label="Reset"
            size="md"
            variant="ghost"
            colorScheme="blue"
            onClick={handleReset}
            position="absolute"
            right="8px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
          >
            <FaTimes size={18} />
          </IconButton>
        </HStack>
      </Box>
    </Flex>
  );
};

export default MedicineInformation;
