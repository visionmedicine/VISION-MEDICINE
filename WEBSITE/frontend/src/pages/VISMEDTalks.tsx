import { useState } from "react";
import { Box, Flex, Input, IconButton, VStack } from "@chakra-ui/react";
import { FiMic, FiSend } from "react-icons/fi";

const ChatConversation = () => {
  const [messages, setMessages] = useState([
    { from: "vismed", text: "Halo! Ada yang bisa saya bantu?" },
    {
      from: "user",
      text: "Halo VISMED, saya ingin tahu lebih tentang layanan Anda.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input.trim() }]);
    setInput("");

    // Simulasi balasan VISMED
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { from: "vismed", text: "Terima kasih atas pertanyaannya!" },
      ]);
    }, 1000);
  };

  return (
    <Flex direction="column" h="100vh" w="100%" bg="black">
      {/* Chat area */}
      <Box flex="1" overflowY="auto" p={4}>
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
              borderRadius="md"
              wordBreak="break-word"
              boxShadow="sm"
            >
              {msg.text}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Input area */}
      <Flex
        align="center"
        gap={3}
        borderTop="1px solid"
        borderColor="gray.200"
        p={3}
      >
        <IconButton
          aria-label="Mic"
          size="md"
          colorScheme="blue"
          variant="ghost"
          _focus={{ boxShadow: "none" }}
        >
          <FiMic />
        </IconButton>
        <Input
          placeholder="Tulis pesan..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          flex="1"
        />
        <IconButton
          aria-label="Send"
          size="md"
          colorScheme="blue"
          onClick={handleSend}
          _focus={{ boxShadow: "none" }}
        >
          <FiSend />
        </IconButton>
      </Flex>
    </Flex>
  );
};

export default ChatConversation;
