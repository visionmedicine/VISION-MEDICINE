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
  FaMicrophone,
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

  useEffect(() => {
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
    setOpenStates({});
  }, [input]);

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
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 3 }}
                  cursor="pointer"
                  justify="space-between"
                  borderBottom={openStates[idx] ? "1px solid" : "none"}
                  borderColor="gray.600"
                  onClick={() => toggleDropdown(idx)}
                >
                  <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
                    {med.name}
                  </Text>
                  {openStates[idx] ? <FaChevronUp /> : <FaChevronDown />}
                </HStack>
                <Collapse in={openStates[idx]} animateOpacity>
                  <Box
                    px={{ base: 3, md: 4 }}
                    py={{ base: 2, md: 3 }}
                    bg="gray.700"
                    borderRadius="0 0 2xl 2xl"
                    fontSize={{ base: "sm", md: "md" }}
                  >
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
              fontSize={{ base: "md", md: "lg" }}
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
        p={{ base: 2, md: 3 }}
        bg="#2f2f2f"
        borderRadius="2xl"
        boxShadow="md"
        position="relative"
      >
        {/* Mic icon (left) */}
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

        {/* Input field */}
        <Input
          placeholder="Cari obat, kegunaan, atau efek samping..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          pl={{ base: "35px", md: "40px" }}
          pr={{ base: "90px", md: "110px" }} // ruang untuk search + clear
          color="black"
          bg="white"
          borderRadius="2xl"
          fontSize={{ base: "sm", md: "md" }}
        />

        {/* Search icon */}
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

        {/* Reset icon */}
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
  );
};

export default MedicineInformation;
