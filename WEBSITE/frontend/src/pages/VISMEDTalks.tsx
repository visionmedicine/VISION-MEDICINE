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
import { FiMic, FiSend } from "react-icons/fi";
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScroll = useRef(true);

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
      recognition.lang = "id-ID"; // Bahasa Indonesia
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
                maxW={{ base: "85%", md: "70%" }}
                bg="#445775"
                px={4}
                py={2}
                borderRadius="xl"
              >
                <Spinner size="sm" color="white" />
                <Text color="white">VISMED sedang mengetik...</Text>
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
          position="relative"
          borderRadius="2xl"
        >
          {/* Mic button */}
          <IconButton
            aria-label="Mic"
            size={{ base: "sm", md: "md" }}
            variant="ghost"
            colorScheme={isListening ? "red" : "blue"}
            position="absolute"
            left={{ base: "6px", md: "10px" }}
            top="50%"
            transform="translateY(-50%)"
            zIndex="1"
            onClick={handleMicClick}
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
