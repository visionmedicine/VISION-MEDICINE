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

const ChatConversation = () => {
  const [messages, setMessages] = useState([
    { from: "vismed", text: "Halo! Ada yang bisa VISMED bantu?" },
    {
      from: "user",
      text: "Halo VISMED, saya ingin tahu lebih tentang layanan Anda.",
    },
  ]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Scroll ke atas saat pertama kali load halaman
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <Flex direction="column" h="100vh" w="100%" bg="#242424" p={2}>
      {/* Header */}
      <Flex
        align="center"
        bg="white"
        color="black"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.300"
        boxShadow="sm"
        borderRadius="xl" // header bg membulat
      >
        <HStack gap={2}>
          <FiMic size={20} color="black" />
          <Text fontSize="xl" fontWeight="bold" color="black">
            VISMED Talks
          </Text>
        </HStack>
      </Flex>

      {/* Chat Area */}
      <Box ref={chatContainerRef} flex="1" overflowY="auto" p={4}>
        <VStack gap={3} align="stretch">
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              maxW="70%"
              alignSelf={msg.from === "vismed" ? "flex-start" : "flex-end"}
              bg={msg.from === "vismed" ? "#445775" : "#D9D9D9"}
              color={msg.from === "vismed" ? "white" : "black"}
              px={4}
              py={2}
              borderRadius="xl" // bubble chat membulat
              wordBreak="break-word"
              boxShadow="sm"
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
        p={3}
        bg="#2f2f2f"
        position="relative"
        borderRadius="2xl" // input bar membulat juga biar konsisten
      >
        {/* Mic button */}
        <IconButton
          aria-label="Mic"
          size="sm"
          variant="ghost"
          colorScheme="blue"
          position="absolute"
          left="10px"
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
          pl="40px"
          pr="40px"
          color="black"
          bg="white"
          borderRadius="2xl"
        />

        {/* Send button */}
        <IconButton
          aria-label="Send"
          size="sm"
          variant="ghost"
          colorScheme="blue"
          onClick={handleSend}
          position="absolute"
          right="10px"
          top="50%"
          transform="translateY(-50%)"
          zIndex="1"
        >
          <FiSend />
        </IconButton>
      </Box>
    </Flex>
  );
};

export default ChatConversation;
