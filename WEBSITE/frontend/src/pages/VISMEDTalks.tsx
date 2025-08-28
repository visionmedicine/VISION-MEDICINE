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
  const inputRef = useRef<HTMLInputElement | null>(null); // ⬅️ fokus input

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

    // ⬅️ jaga fokus biar keyboard gak nutup
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
        maxH="100dvh"
        w="100%"
        bg="#242424"
        p={{ base: 2, md: 4 }}
        overflow="hidden"
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
                whiteSpace="pre-wrap"
                boxShadow="sm"
                fontSize={{ base: "sm", md: "md" }}
              >
                {msg.text}
              </Box>
            ))}

            {isTyping && (
              <Flex
                align="center"
                gap={2}
                alignSelf="flex-start"
                bg="#445775"
                px={3}
                py={2}
                borderRadius="xl"
                boxShadow="sm"
                w="fit-content"
              >
                <Spinner size="sm" color="white" />
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  VISMED sedang mengetik...
                </Text>
              </Flex>
            )}
          </VStack>
        </Box>

        {/* Input Area */}
        <Box
          borderTop="4px solid"
          borderColor="gray.600"
          p={{ base: 2, md: 3 }}
          bg="#2f2f2f"
          position="sticky"
          bottom={{ base: "9px", md: "12px" }}
          borderRadius="2xl"
          zIndex={100}
        >
          {/* Wrapper untuk tombol + dan popup */}
          <Box ref={menuRef}>
            <IconButton
              type="button" // ⬅️ fix biar gak blur input
              aria-label="Menu"
              size={{ base: "sm", md: "md" }}
              variant="ghost"
              colorScheme="green"
              position="absolute"
              left={{ base: "6px", md: "10px" }}
              top="50%"
              transform="translateY(-50%)"
              zIndex="2"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              bg="transparent"
              _hover={{ bg: "transparent" }}
              _active={{ bg: "transparent" }}
              _focus={{ boxShadow: "none", bg: "transparent" }}
            >
              <FiPlus />
            </IconButton>

            {isMenuOpen && (
              <Box
                position="absolute"
                bottom="50px"
                left="10px"
                bg="white"
                color="black"
                p={2}
                borderRadius="full"
                boxShadow="lg"
                zIndex="10"
              >
                <Flex
                  align="center"
                  gap={2}
                  cursor="pointer"
                  _hover={{ bg: "gray.200" }}
                  px={3}
                  py={2}
                  borderRadius="full" // ⬅️ bikin tombol super bulat
                  onClick={handleClearChat}
                >
                  <FiTrash2 />
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
            colorScheme={isListening ? "red" : "blue"}
            position="absolute"
            left={{ base: "42px", md: "50px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
            onClick={handleMicClick}
            bg="transparent"
            _hover={{ bg: "transparent" }}
            _active={{ bg: "transparent" }}
            _focus={{ boxShadow: "none", bg: "transparent" }}
          >
            <FiMic />
          </IconButton>

          {/* Input */}
          <Input
            ref={inputRef} // ⬅️ biar bisa di-focus lagi
            placeholder="Tulis pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            pl={{ base: "70px", md: "80px" }}
            pr={{ base: "35px", md: "40px" }}
            color="black"
            bg="white"
            borderRadius="2xl"
            fontSize={{ base: "sm", md: "md" }}
          />

          {/* Send button */}
          <IconButton
            type="button"
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
            bg="transparent"
            _hover={{ bg: "transparent" }}
            _active={{ bg: "transparent" }}
            _focus={{ boxShadow: "none", bg: "transparent" }}
          >
            <FiSend />
          </IconButton>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default VISMEDTalks;
