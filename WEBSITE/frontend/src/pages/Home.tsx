/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import {
  Box,
  Heading,
  Text,
  Flex,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { useRef, useState, useEffect } from "react";

const Home = () => {
  const steps = [
    "Buka Website Vision Medicine",
    "Masuk ke Akun Anda",
    "Akses Menu Deteksi Obat",
    "Unggah Foto Obat",
    "Pilih Metode Deteksi",
    "Tunggu Proses Analisis",
    "Lihat Hasil Deteksi",
    "Periksa Detail Obat",
    "Simpan atau Unduh Hasil",
    "Selesai & Gunakan Informasi",
  ];

  const products = [
    "Vision Medicine Website",
    "Mobile App Vision Medicine",
    "Fitur Deteksi Obat via Kamera",
    "Database Informasi Obat Terbaru",
    "Fitur Pemindaian Barcode",
    "Rekomendasi Obat Alternatif",
    "Laporan Kesehatan Digital",
    "Integrasi dengan Apotek Mitra",
    "Mode Offline Deteksi Obat",
    "Sistem Notifikasi & Pengingat",
  ];

  const scrollRef1 = useRef<HTMLDivElement | null>(null);
  const scrollRef2 = useRef<HTMLDivElement | null>(null);

  const [showLeftArrow1, setShowLeftArrow1] = useState(false);
  const [showRightArrow1, setShowRightArrow1] = useState(true);
  const [showLeftArrow2, setShowLeftArrow2] = useState(false);
  const [showRightArrow2, setShowRightArrow2] = useState(true);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    setLeft: (val: boolean) => void,
    setRight: (val: boolean) => void
  ) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setLeft(scrollLeft > 0);
      setRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  const scrollHorizontally = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => {
    if (!ref.current) return;
    const firstCard = ref.current.querySelector(
      "div[data-step-card]"
    ) as HTMLElement;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 300;
    ref.current.scrollBy({
      left:
        direction === "right"
          ? isMobile
            ? cardWidth
            : 300
          : isMobile
          ? -cardWidth
          : -300,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    handleScroll(scrollRef1, setShowLeftArrow1, setShowRightArrow1);
    handleScroll(scrollRef2, setShowLeftArrow2, setShowRightArrow2);
  }, []);

  const scrollStyle = css`
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  `;

  return (
    <Box p={3} pl={{ base: 10, md: 4 }} position="relative">
      <Heading fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold">
        Selamat Datang di Vision Medicine!
      </Heading>
      <Text fontSize={{ base: "lg", md: "xl" }} mt={2}>
        Deteksi Obat Kini Lebih Mudah
      </Text>

      {/* Bagian 1: Tutorial Step by Step */}
      <Heading
        mt={8}
        fontSize={{ base: "lg", md: "xl" }}
        color="orange.400"
        fontWeight="bold"
      >
        Tutorial Step by Step Vision Medicine Website
      </Heading>

      <Flex mt={4} position="relative" align="center">
        {showLeftArrow1 && (
          <IconButton
            aria-label="Scroll Left"
            onClick={() => scrollHorizontally(scrollRef1, "left")}
            position="absolute"
            left="-16px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            variant="ghost"
            color="white"
            fontSize="28px"
            _hover={{ bg: "transparent" }}
          >
            <FiChevronLeft />
          </IconButton>
        )}

        <Flex
          ref={scrollRef1}
          gap={4}
          overflowX="auto"
          css={scrollStyle}
          scrollBehavior="smooth"
          onScroll={() =>
            handleScroll(scrollRef1, setShowLeftArrow1, setShowRightArrow1)
          }
          align="stretch"
        >
          {steps.map((step, index) => (
            <Box
              key={index}
              data-step-card
              minW={{ base: "100%", md: "30%" }}
              flexShrink={0}
              bg="#445775"
              boxShadow="md"
              borderRadius="md"
              p={4}
            >
              <Heading fontSize="lg" color="white" mb={2}>
                {`Step ${index + 1}`}
              </Heading>
              <Text fontSize="sm" color="white">
                {step}
              </Text>
            </Box>
          ))}
        </Flex>

        {showRightArrow1 && (
          <IconButton
            aria-label="Scroll Right"
            onClick={() => scrollHorizontally(scrollRef1, "right")}
            position="absolute"
            right="-16px"
            top="50%"
            transform="translateY(-50%)"
            variant="ghost"
            color="white"
            fontSize="28px"
            _hover={{ bg: "transparent" }}
          >
            <FiChevronRight />
          </IconButton>
        )}
      </Flex>

      {/* Kotak Scan Your Medicine */}
      <Box
        mt={8}
        bg="white"
        borderRadius="md"
        p={{ base: 3, md: 5 }}
        boxShadow="lg"
        textAlign="center"
        cursor="pointer"
        color="black"
        _hover={{
          bg: "orange.500",
          color: "white",
        }}
      >
        <Heading fontSize={{ base: "lg", md: "2xl" }}>
          ===== Scan Your Medicine =====
        </Heading>
      </Box>

      {/* Bagian 2: Our Product */}
      <Heading
        mt={8}
        fontSize={{ base: "lg", md: "xl" }}
        color="orange.400"
        fontWeight="bold"
      >
        Our Product
      </Heading>

      <Flex mt={4} position="relative" align="center">
        {showLeftArrow2 && (
          <IconButton
            aria-label="Scroll Left"
            onClick={() => scrollHorizontally(scrollRef2, "left")}
            position="absolute"
            left="-16px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            variant="ghost"
            color="white"
            fontSize="28px"
            _hover={{ bg: "transparent" }}
          >
            <FiChevronLeft />
          </IconButton>
        )}

        <Flex
          ref={scrollRef2}
          gap={4}
          overflowX="auto"
          css={scrollStyle}
          scrollBehavior="smooth"
          onScroll={() =>
            handleScroll(scrollRef2, setShowLeftArrow2, setShowRightArrow2)
          }
          align="stretch"
        >
          {products.map((product, index) => (
            <Box
              key={index}
              data-step-card
              minW={{ base: "100%", md: "30%" }}
              flexShrink={0}
              bg="#445775"
              boxShadow="md"
              borderRadius="md"
              p={4}
            >
              <Heading fontSize="lg" color="white" mb={2}>
                {`Product ${index + 1}`}
              </Heading>
              <Text fontSize="sm" color="white">
                {product}
              </Text>
            </Box>
          ))}
        </Flex>

        {showRightArrow2 && (
          <IconButton
            aria-label="Scroll Right"
            onClick={() => scrollHorizontally(scrollRef2, "right")}
            position="absolute"
            right="-16px"
            top="50%"
            transform="translateY(-50%)"
            variant="ghost"
            color="white"
            fontSize="28px"
            _hover={{ bg: "transparent" }}
          >
            <FiChevronRight />
          </IconButton>
        )}
      </Flex>
    </Box>
  );
};

export default Home;
