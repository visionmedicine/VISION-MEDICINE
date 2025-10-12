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
  Spinner,
  Heading,
} from "@chakra-ui/react";
import { FiMic, FiSend, FiPlus, FiTrash2 } from "react-icons/fi";
import PageTransition from "@/components/layouts/PageTransition";

// ==== Tambahan Type untuk Web Speech API ====
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
}
// ===========================================

interface Message {
  from: "user" | "vismed";
  text: string;
}

const VISMEDTalks = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScroll = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load chat history dari localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("vismed_messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Simpan chat history ke localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("vismed_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll otomatis ke bawah
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

  // Inisialisasi SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Browser tidak mendukung SpeechRecognition");
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInput("");
    inputRef.current?.focus();
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { from: "vismed", text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { from: "vismed", text: "Terjadi error, coba lagi nanti 😅" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Browser Anda tidak mendukung speech recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem("vismed_messages");
    setIsMenuOpen(false);
  };

  // Close menu kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <PageTransition>
      <Flex
        direction="column"
        minH="100dvh"
        w="100%"
        p={{ base: 3, md: 5 }}
        color="white"
        position="relative"
        overflow="hidden"
        justify="flex-start"
        pt={{ base: 4, md: 6 }}
      >
        {/* Header dengan gaya glassmorphism */}
        <Box
          position="relative"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          borderRadius="2xl"
          p={{ base: 5, md: 6 }}
          mb={6}
          bg="rgba(255, 255, 255, 0.15)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.25)"
          backdropFilter="blur(14px) saturate(180%)"
          border="1px solid rgba(255, 255, 255, 0.2)"
          transition="all 0.3s ease"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "0 12px 36px rgba(255,165,0,0.25)",
          }}
          mt={{ base: -1, md: -2 }}
        >
          <HStack justify="center" gap={3}>
            <FiMic size={28} color="#FFA500" />
            <Heading
              fontSize={{ base: "2xl", md: "3xl" }}
              bgGradient="linear(to-r, orange.300, yellow.400)"
              bgClip="text"
              fontWeight="extrabold"
              letterSpacing="wide"
              color="rgba(255,255,255,0.85)"
            >
              VISMED Talks
            </Heading>
          </HStack>
          <Text
            mt={3}
            fontSize={{ base: "md", md: "lg" }}
            textAlign="center"
            color="rgba(255,255,255,0.85)"
            maxW="90%"
          >
            Ngobrol seru dengan VISMED, asisten AI yang siap membantu
          </Text>
        </Box>

        {/* Chat Area */}
        <Box
          ref={chatContainerRef}
          flex="1"
          borderRadius="2xl"
          border="1px solid rgba(255,255,255,0.15)"
          boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          backdropFilter="blur(10px)"
          overflow="hidden"
          bg="rgba(255,255,255,0.08)"
          position="relative"
          mb={4}
          p={{ base: 3, md: 4 }}
          onScroll={checkIfAtBottom}
          maxH="calc(100vh - 300px)" // Adjust to prevent overflow
          overflowY="auto"
        >
          <VStack gap={3} align="stretch">
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                maxW={{ base: "85%", md: "70%" }}
                alignSelf={msg.from === "vismed" ? "flex-start" : "flex-end"}
                bg={
                  msg.from === "vismed"
                    ? "rgba(68,87,117,0.6)"
                    : "rgba(255,165,0,0.25)"
                }
                color={msg.from === "vismed" ? "white" : "white"}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 2 }}
                borderRadius="xl"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
                boxShadow="sm"
                fontSize={{ base: "sm", md: "md" }}
                backdropFilter="blur(10px)"
                border="1px solid rgba(255,255,255,0.2)"
              >
                {msg.text}
              </Box>
            ))}

            {isTyping && (
              <Flex
                align="center"
                gap={2}
                alignSelf="flex-start"
                bg="rgba(68,87,117,0.6)"
                px={3}
                py={2}
                borderRadius="xl"
                boxShadow="sm"
                w="fit-content"
                backdropFilter="blur(10px)"
                border="1px solid rgba(255,255,255,0.2)"
              >
                <Spinner size="sm" color="white" />
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  VISMED sedang mengetik...
                </Text>
              </Flex>
            )}
          </VStack>
        </Box>

        {/* Input Area - Removed sticky and bottom to keep it in flow at bottom */}
        <Box
          borderTop="1px solid rgba(255,255,255,0.15)"
          p={{ base: 3, md: 4 }}
          bg="rgba(255,255,255,0.12)"
          backdropFilter="blur(16px)"
          border="1px solid rgba(255,255,255,0.15)"
          borderRadius="2xl"
          boxShadow="0 8px 24px rgba(255,165,0,0.2)"
          position="relative"
          zIndex={100}
        >
          {/* Wrapper untuk tombol + dan popup */}
          <Box ref={menuRef}>
            <IconButton
              type="button"
              aria-label="Menu"
              size={{ base: "sm", md: "md" }}
              variant="ghost"
              colorScheme="orange"
              position="absolute"
              left={{ base: "6px", md: "10px" }}
              top="50%"
              transform="translateY(-50%)"
              zIndex="2"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              bg="transparent"
              _hover={{ bg: "rgba(255,165,0,0.2)" }}
              _active={{ bg: "rgba(255,165,0,0.3)" }}
              _focus={{ boxShadow: "none", bg: "rgba(255,165,0,0.2)" }}
            >
              <FiPlus size={18} />
            </IconButton>

            {isMenuOpen && (
              <Box
                position="absolute"
                bottom="50px"
                left="10px"
                bg="rgba(255, 255, 255, 0.15)"
                color="white"
                p={2}
                borderRadius="full"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.25)"
                backdropFilter="blur(14px) saturate(180%)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                zIndex="10"
              >
                <Flex
                  align="center"
                  gap={2}
                  cursor="pointer"
                  _hover={{ bg: "rgba(255,165,0,0.2)" }}
                  px={3}
                  py={2}
                  borderRadius="full"
                  onClick={handleClearChat}
                >
                  <FiTrash2 size={16} color="white" />
                  <Text fontSize="sm">Clear Chat</Text>
                </Flex>
              </Box>
            )}
          </Box>

          {/* Mic button */}
          <IconButton
            type="button"
            aria-label="Mic"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme={isListening ? "red" : "orange"}
            position="absolute"
            left={{ base: "42px", md: "50px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
            onClick={handleMicClick}
            bg="transparent"
            _hover={{ bg: "rgba(255,165,0,0.2)" }}
            _active={{ bg: "rgba(255,165,0,0.3)" }}
            _focus={{ boxShadow: "none", bg: "rgba(255,165,0,0.2)" }}
          >
            <FiMic size={18} />
          </IconButton>

          {/* Input */}
          <Input
            ref={inputRef}
            placeholder="Tulis pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            pl={{ base: "70px", md: "80px" }}
            pr={{ base: "35px", md: "40px" }}
            color="black"
            bg="rgba(255,255,255,0.9)"
            borderRadius="2xl"
            fontSize={{ base: "sm", md: "md" }}
            border="1px solid rgba(255,255,255,0.3)"
            _placeholder={{ color: "gray.500" }}
            _focus={{ boxShadow: "0 0 0 1px rgba(255,165,0,0.5)" }}
          />

          {/* Send button */}
          <IconButton
            type="button"
            aria-label="Send"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme="orange"
            onClick={handleSend}
            position="absolute"
            right={{ base: "6px", md: "10px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
            bg="transparent"
            _hover={{ bg: "rgba(255,165,0,0.2)" }}
            _active={{ bg: "rgba(255,165,0,0.3)" }}
            _focus={{ boxShadow: "none", bg: "rgba(255,165,0,0.2)" }}
          >
            <FiSend size={18} />
          </IconButton>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default VISMEDTalks;
