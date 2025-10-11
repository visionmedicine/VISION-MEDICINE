import {
  Box,
  Heading,
  Text,
  Flex,
  IconButton,
  useBreakpointValue,
  Image,
} from "@chakra-ui/react";
import {
  FiChevronRight,
  FiChevronLeft,
  FiZoomIn,
  FiVideo,
} from "react-icons/fi";
import { useRef, useState, useEffect } from "react";
import { keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/layouts/PageTransition";

type MediaItem = {
  name: string;
  url: string;
};

// 🔥 Animasi loading titik-titik
const wave = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
`;

const Home = () => {
  const [howToUse, setHowToUse] = useState<MediaItem[]>([]);
  const [products, setProducts] = useState<MediaItem[]>([]);
  const [loadingHowToUse, setLoadingHowToUse] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const scrollRef1 = useRef<HTMLDivElement | null>(null);
  const scrollRef2 = useRef<HTMLDivElement | null>(null);

  const [showLeftArrow1, setShowLeftArrow1] = useState(false);
  const [showRightArrow1, setShowRightArrow1] = useState(true);
  const [showLeftArrow2, setShowLeftArrow2] = useState(false);
  const [showRightArrow2, setShowRightArrow2] = useState(true);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const navigate = useNavigate();

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

  // ✅ Fetch data API
  const fetchData = async (
    endpoint: string,
    setter: (data: MediaItem[]) => void,
    loaderSetter: (val: boolean) => void
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}`
      );
      let data: MediaItem[] = await res.json();
      data = data.filter((item) => item.name !== ".emptyFolderPlaceholder");
      setter(data);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}`, err);
    } finally {
      loaderSetter(false);
    }
  };

  useEffect(() => {
    fetchData("how-to-use", setHowToUse, setLoadingHowToUse);
    fetchData("products", setProducts, setLoadingProducts);
  }, []);

  const stepTitles = [
    "Home Page",
    "VISMED Talks Page",
    "Find Your VISMED Page",
    "Medicine Information Page",
    "Reminder Page",
  ];

  const productTitles = [
    "Tampak Depan",
    "Tampak Atas",
    "Tampak Samping",
    "Tampak Belakang",
    "Tampak Bawah",
  ];

  const handleZoomIn = (url: string) => setSelectedImage(url);

  // ✅ Render List
  const renderHorizontalList = (
    items: MediaItem[],
    titlePrefix: string,
    ref: React.RefObject<HTMLDivElement | null>,
    showLeftArrow: boolean,
    showRightArrow: boolean,
    setShowLeftArrow: (val: boolean) => void,
    setShowRightArrow: (val: boolean) => void,
    isLoading: boolean = false
  ) => (
    <Flex mt={4} position="relative" align="center" minH="360px">
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
          _hover={{ bg: "transparent", color: "orange.300" }}
        >
          <FiChevronLeft />
        </IconButton>
      )}

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
                bg="orange.300"
                animation={`${wave} 1s ease-in-out infinite`}
                animationDelay={`${i * 0.2}s`}
              />
            ))}
          </Flex>
        ) : (
          items.map((item, index) => {
            let titleText = `${titlePrefix} ${index + 1}`;
            if (titlePrefix === "Step" && stepTitles[index]) {
              titleText = stepTitles[index];
            } else if (titlePrefix === "Product" && productTitles[index]) {
              titleText = productTitles[index];
            }

            return (
              <Box
                key={index}
                data-step-card
                minW={{ base: "100%", md: "30%" }}
                maxW={{ base: "100%", md: "30%" }}
                flexShrink={0}
                bg="rgba(68, 87, 117, 0.55)"
                backdropFilter="blur(12px)"
                border="1px solid rgba(255, 255, 255, 0.18)"
                boxShadow="0 8px 24px rgba(255, 165, 0, 0.1)"
                borderRadius="2xl"
                p={4}
                minH="320px"
                position="relative"
                transition="all 0.3s ease"
                _hover={{
                  transform: "translateY(-6px)",
                  boxShadow: "0 12px 28px rgba(255, 165, 0, 0.25)",
                }}
              >
                <Heading fontSize="lg" color="white" mb={3}>
                  {titleText}
                </Heading>

                <Box
                  position="relative"
                  textAlign="center"
                  overflow="hidden"
                  borderRadius="12px"
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      transition: "transform 0.3s ease",
                    }}
                  />

                  <IconButton
                    aria-label="Zoom In"
                    size="sm"
                    colorScheme="orange"
                    variant="solid"
                    position="absolute"
                    top="8px"
                    left="8px"
                    borderRadius="full"
                    onClick={() => handleZoomIn(item.url)}
                  >
                    <FiZoomIn />
                  </IconButton>
                </Box>
              </Box>
            );
          })
        )}
      </Flex>

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
          _hover={{ bg: "transparent", color: "orange.300" }}
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
        color="white"
        minH="100vh"
        position="relative"
        overflow="hidden"
      >
        {/* ✅ Background dihapus agar tidak bertumpuk dengan index.css / App.css */}

        <Box position="relative" zIndex={1}>
          <Heading fontSize={{ base: "2xl", md: "4xl" }} fontWeight="bold">
            Selamat Datang di Vision Medicine!
          </Heading>
          <Text fontSize={{ base: "lg", md: "xl" }} mt={2}>
            Deteksi Obat Kini Lebih Mudah
          </Text>

          {/* How to Use */}
          <Box
            mt={8}
            bg="rgba(255,255,255,0.08)"
            backdropFilter="blur(14px)"
            border="1px solid rgba(255,255,255,0.15)"
            borderRadius="2xl"
            p={{ base: 4, md: 6 }}
            boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          >
            <Heading fontSize={{ base: "lg", md: "xl" }} color="orange.400">
              How to Use ?
            </Heading>
            {renderHorizontalList(
              howToUse,
              "Step",
              scrollRef1,
              showLeftArrow1,
              showRightArrow1,
              setShowLeftArrow1,
              setShowRightArrow1,
              loadingHowToUse
            )}
          </Box>

          {/* Live Stream */}
          <Box
            mt={8}
            bg="rgba(255,255,255,0.12)"
            backdropFilter="blur(14px)"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="2xl"
            p={{ base: 3, md: 5 }}
            boxShadow="0 8px 24px rgba(255,165,0,0.2)"
            textAlign="center"
            cursor="pointer"
            color="white"
            onClick={() => navigate("/livestream")}
            transition="all 0.3s ease"
            _hover={{
              bg: "rgba(255,165,0,0.25)",
              transform: "scale(1.01)",
              boxShadow: "0 12px 30px rgba(255,165,0,0.3)",
            }}
          >
            <Flex justify="center" align="center" gap={2}>
              <FiVideo size={24} color="#FFA500" />
              <Heading
                fontSize={{ base: "17px", md: "2xl" }}
                color="orange.300"
              >
                Live Stream Detection
              </Heading>
            </Flex>
          </Box>

          {/* Our Product */}
          <Box
            mt={8}
            bg="rgba(255,255,255,0.08)"
            backdropFilter="blur(14px)"
            border="1px solid rgba(255,255,255,0.15)"
            borderRadius="2xl"
            p={{ base: 4, md: 6 }}
            boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          >
            <Heading fontSize={{ base: "lg", md: "xl" }} color="orange.400">
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
        </Box>
      </Box>

      {/* ✅ Overlay Popup — klik di mana pun buat close */}
      {selectedImage && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="rgba(0,0,0,0.85)"
          backdropFilter="blur(8px)"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setSelectedImage(null)}
        >
          <Image
            src={selectedImage}
            maxH="90vh"
            maxW="90vw"
            borderRadius="xl"
            boxShadow="0 12px 32px rgba(255,165,0,0.3)"
          />
        </Box>
      )}
    </PageTransition>
  );
};

export default Home;
