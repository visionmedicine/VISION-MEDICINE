// src/pages/Home.tsx
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
import { keyframes } from "@emotion/react";
import PageTransition from "@/components/layouts/PageTransition";

type Product = {
  name: string;
  url: string;
};

// 🔥 Keyframes animasi loading
const wave = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
`;

const Home = () => {
  const steps = [
    "Buka Website Vision Medicine",
    "Masuk ke Akun Anda",
    "Akses Menu Deteksi Obat",
    "Unggah Foto Obat",
    "Lihat Hasil Deteksi", // 🔥 cuma 5 langkah
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true); // 🔥 loading state

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
    ) as HTMLElement | null;
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

    const ref1 = scrollRef1.current;
    const ref2 = scrollRef2.current;

    const listener1 = () =>
      handleScroll(scrollRef1, setShowLeftArrow1, setShowRightArrow1);
    const listener2 = () =>
      handleScroll(scrollRef2, setShowLeftArrow2, setShowRightArrow2);

    if (ref1) ref1.addEventListener("scroll", listener1);
    if (ref2) ref2.addEventListener("scroll", listener2);

    return () => {
      if (ref1) ref1.removeEventListener("scroll", listener1);
      if (ref2) ref2.removeEventListener("scroll", listener2);
    };
  }, []);

  // ===== FETCH PRODUCTS FROM BACKEND =====
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products");
        let data: Product[] = await res.json();

        // 🔥 Filter produk biar gak ada .emptyFolderPlaceholder
        data = data.filter((item) => item.name !== ".emptyFolderPlaceholder");

        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoadingProducts(false); // 🔥 stop loading
      }
    };

    fetchProducts();
  }, []);

  const renderHorizontalList = (
    items: Product[] | string[],
    titlePrefix: string,
    ref: React.RefObject<HTMLDivElement | null>,
    showLeftArrow: boolean,
    showRightArrow: boolean,
    setShowLeftArrow: (val: boolean) => void,
    setShowRightArrow: (val: boolean) => void,
    isLoading: boolean = false,
    titleFormatter?: (index: number, item: Product | string) => string
  ) => (
    <Flex mt={4} position="relative" align="center" minH="340px">
      {/* Left Arrow */}
      {showLeftArrow && !isLoading && (
        <IconButton
          aria-label="Scroll Left"
          onClick={() => scrollHorizontally(ref, "left")}
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

      {/* Loader or Items */}
      <Flex
        ref={ref}
        gap={4}
        overflowX="auto"
        scrollBehavior="smooth"
        onScroll={() => handleScroll(ref, setShowLeftArrow, setShowRightArrow)}
        align="stretch"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
        w="100%"
        justify={isLoading ? "center" : "flex-start"}
        alignItems="center"
      >
        {isLoading ? (
          <Flex gap={2}>
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
          items.map((item, index) => (
            <Box
              key={index}
              data-step-card
              minW={{ base: "100%", md: "30%" }}
              maxW={{ base: "100%", md: "30%" }}
              flexShrink={0}
              bg="#445775"
              boxShadow="md"
              borderRadius="md"
              p={4}
              borderLeft="5px solid white"
              minH="320px"
            >
              <Heading fontSize="lg" color="white" mb={2}>
                {titleFormatter
                  ? titleFormatter(index, item)
                  : `${titlePrefix} ${index + 1}`}
              </Heading>
              {typeof item === "string" ? (
                <Text fontSize="sm" color="white">
                  {item}
                </Text>
              ) : (
                <Box textAlign="center">
                  <img
                    src={item.url}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                  <Text fontSize="sm" color="white" mt={2}>
                    {item.name}
                  </Text>
                </Box>
              )}
            </Box>
          ))
        )}
      </Flex>

      {/* Right Arrow */}
      {showRightArrow && !isLoading && (
        <IconButton
          aria-label="Scroll Right"
          onClick={() => scrollHorizontally(ref, "right")}
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
  );

  return (
    <PageTransition>
      <Box
        p={3}
        pl={{ base: 10, md: 4 }}
        position="relative"
        bg="#242424"
        color="white"
      >
        {/* Judul Halaman */}
        <Heading fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold">
          Selamat Datang di Vision Medicine!
        </Heading>
        <Text fontSize={{ base: "lg", md: "xl" }} mt={2}>
          Deteksi Obat Kini Lebih Mudah
        </Text>

        {/* Bagian 1 */}
        <Box
          mt={8}
          bg="rgba(255,255,255,0.09)"
          borderRadius="md"
          p={{ base: 4, md: 6 }}
          boxShadow="lg"
          color="black"
        >
          <Heading
            fontSize={{ base: "lg", md: "xl" }}
            color="orange.400"
            fontWeight="bold"
          >
            How to Use
          </Heading>
          {renderHorizontalList(
            steps,
            "Step",
            scrollRef1,
            showLeftArrow1,
            showRightArrow1,
            setShowLeftArrow1,
            setShowRightArrow1,
            false,
            // 🔥 Custom title sesuai permintaan
            (i) =>
              i === 0
                ? "Home"
                : i === 1
                ? "VISMED Talks"
                : i === 2
                ? "Find Your VISMED"
                : i === 3
                ? "Medicine Information"
                : "Reminder"
          )}
        </Box>

        {/* Kotak Scan */}
        <Box
          mt={8}
          bg="rgba(255,255,255,0.9)"
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
          <Heading fontSize={{ base: "17px", md: "2xl" }}>
            ===== Live Stream Detection =====
          </Heading>
        </Box>

        {/* Bagian 2 */}
        <Box
          mt={8}
          bg="rgba(255,255,255,0.09)"
          borderRadius="md"
          p={{ base: 4, md: 6 }}
          boxShadow="lg"
          color="black"
        >
          <Heading
            fontSize={{ base: "lg", md: "xl" }}
            color="orange.400"
            fontWeight="bold"
          >
            Our Product
          </Heading>
          {renderHorizontalList(
            products,
            "Product",
            scrollRef2,
            showLeftArrow2,
            showRightArrow2,
            setShowLeftArrow2,
            setShowRightArrow2,
            loadingProducts
          )}
        </Box>

        {/* Bagian Quote */}
        <Flex
          mt={12}
          p={1}
          bg="#242424"
          borderRadius="md"
          align="stretch"
          boxShadow="lg"
        >
          <Box
            w={{ base: "80px", md: "20px" }}
            bg="#445775"
            borderRadius="full"
            mr={4}
          />
          <Box pr={{ base: 4, md: 8 }} maxW="1400px">
            <Text fontSize={{ base: "sm", md: "md" }} lineHeight="tall">
              "Kami percaya bahwa teknologi seharusnya bisa diakses dan memberi
              manfaat untuk semua. Dengan Vision Medicine, kami membawa harapan
              baru bagi saudara saudara kita yang membutuhkan akses informasi
              obat dengan cara yang lebih inklusif."
            </Text>
            <Text
              mt={3}
              fontWeight="bold"
              fontStyle="italic"
              transform="skewX(-20deg)"
              fontSize={{ base: "xs", md: "sm" }}
            >
              ---- Member of VISMED ----
            </Text>
          </Box>
        </Flex>
      </Box>
    </PageTransition>
  );
};

export default Home;
