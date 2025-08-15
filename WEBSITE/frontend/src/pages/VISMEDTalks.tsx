// src/pages/VISMEDTalks.tsx
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Flex,
  Input,
  VStack,
  IconButton,
  Text,
  HStack,
} from "@chakra-ui/react";
import { FiMic, FiSend } from "react-icons/fi";
import PageTransition from "@/components/layouts/PageTransition";

const VISMEDTalks = () => {
  const [messages, setMessages] = useState([
    { from: "vismed", text: "Halo! Ada yang bisa VISMED bantu?" },
    {
      from: "user",
      text: "Halo VISMED, saya ingin tahu lebih tentang layanan Anda.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScroll = useRef(true);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: input.trim() }]);
    setInput("");

    // Simulasi balasan VISMED
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "vismed", text: "Terima kasih atas pertanyaannya!" },
      ]);
    }, 1000);
  };

  const checkIfAtBottom = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 10;
  };

  useEffect(() => {
    if (shouldAutoScroll.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
          color="black"
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          borderBottom="4px solid"
          borderColor="gray.600"
          boxShadow="sm"
          borderRadius="2xl"
        >
          <HStack gap={2}>
            <FiMic size={24} color="white" />
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color="white"
            >
              VISMED Talks
            </Text>
          </HStack>
        </Flex>

        {/* Chat Area */}
        <Box
          ref={chatContainerRef}
          flex="1"
          overflowY="auto"
          p={{ base: 3, md: 4 }}
          onScroll={checkIfAtBottom}
        >
          <VStack gap={3} align="stretch">
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                maxW={{ base: "85%", md: "70%" }}
                alignSelf={msg.from === "vismed" ? "flex-start" : "flex-end"}
                bg={msg.from === "vismed" ? "#445775" : "#D9D9D9"}
                color={msg.from === "vismed" ? "white" : "black"}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 2 }}
                borderRadius="xl"
                wordBreak="break-word"
                boxShadow="sm"
                fontSize={{ base: "sm", md: "md" }}
              >
                {msg.text}
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Input Area */}
        <Box
          borderTop="4px solid"
          borderColor="gray.600"
          p={{ base: 2, md: 3 }}
          bg="#2f2f2f"
          position="relative"
          borderRadius="2xl"
        >
          {/* Mic button */}
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
            <FiMic />
          </IconButton>

          {/* Input */}
          <Input
            placeholder="Tulis pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            pl={{ base: "35px", md: "40px" }}
            pr={{ base: "35px", md: "40px" }}
            color="black"
            bg="white"
            borderRadius="2xl"
            fontSize={{ base: "sm", md: "md" }}
          />

          {/* Send button */}
          <IconButton
            aria-label="Send"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme="blue"
            onClick={handleSend}
            position="absolute"
            right={{ base: "6px", md: "10px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
          >
            <FiSend />
          </IconButton>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default VISMEDTalks;
