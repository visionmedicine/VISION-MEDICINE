import { Box, Heading } from "@chakra-ui/react";

const MedicineInformation = () => {
  return (
    <Box p={3} pl={{ base: 16, md: 4 }}>
      <Heading fontSize={{ base: "xl", md: "2xl" }}>
        Medicine Information
      </Heading>
    </Box>
  );
};

export default MedicineInformation;
