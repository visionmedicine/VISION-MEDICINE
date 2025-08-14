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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleScrollRight = () => {
    if (!scrollRef.current) return;
    const firstCard = scrollRef.current.querySelector(
      "div[data-step-card]"
    ) as HTMLElement;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 300;
    scrollRef.current.scrollBy({
      left: isMobile ? cardWidth : 300,
      behavior: "smooth",
    });
  };

  const handleScrollLeft = () => {
    if (!scrollRef.current) return;
    const firstCard = scrollRef.current.querySelector(
      "div[data-step-card]"
    ) as HTMLElement;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 300;
    scrollRef.current.scrollBy({
      left: isMobile ? -cardWidth : -300,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
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

      <Heading
        mt={8}
        fontSize={{ base: "lg", md: "xl" }}
        color="orange.400"
        fontWeight="bold"
      >
        Tutorial Step by Step Vision Medicine Website
      </Heading>

      <Flex mt={4} position="relative" align="center">
        {showLeftArrow && (
          <IconButton
            aria-label="Scroll Left"
            onClick={handleScrollLeft}
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
          ref={scrollRef}
          gap={4}
          overflowX="auto"
          css={scrollStyle}
          scrollBehavior="smooth"
          onScroll={handleScroll}
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

        {showRightArrow && (
          <IconButton
            aria-label="Scroll Right"
            onClick={handleScrollRight}
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
