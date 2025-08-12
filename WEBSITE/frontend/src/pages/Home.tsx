import { Box, Heading, Text } from "@chakra-ui/react";

const Home = () => {
  return (
    <Box p={3} pl={{ base: 16, md: 4 }}>
      <Heading fontSize={{ base: "xl", md: "2xl" }}>Home Page</Heading>
      <Text fontSize={{ base: "sm", md: "md" }}>
        Welcome to Vision Medicine!
      </Text>
    </Box>
  );
};

export default Home;
