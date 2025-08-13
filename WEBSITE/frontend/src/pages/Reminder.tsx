import { useState } from "react";
import {
  Box,
  Flex,
  VStack,
  Text,
  HStack,
  Input,
  Button,
  chakra,
} from "@chakra-ui/react";
import { FiClock, FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";

const NativeSelect = chakra("select");

type ReminderRow = {
  medicine: string;
  date: string;
  time: "AM" | "PM";
};

const medicines = [
  "Paracetamol",
  "Amoxicillin",
  "Ibuprofen",
  "Vitamin C",
] as const;

const timeOptions: Array<ReminderRow["time"]> = ["AM", "PM"];

const Reminder = () => {
  const [reminders, setReminders] = useState<ReminderRow[]>([
    { medicine: "", date: "", time: "AM" },
    { medicine: "", date: "", time: "AM" },
    { medicine: "", date: "", time: "AM" },
  ]);

  const handleChange = (
    index: number,
    field: keyof ReminderRow,
    value: string
  ) => {
    setReminders((prev) =>
      prev.map((item, idx) =>
        idx === index ? ({ ...item, [field]: value } as ReminderRow) : item
      )
    );
  };

  const handleSet = (index: number) => {
    const r = reminders[index];
    alert(
      `Reminder diset: ${r.medicine || "Obat"} pada ${r.date || "tanggal"} ${
        r.time
      }`
    );
  };

  const handleAdd = () => {
    setReminders((prev) => [...prev, { medicine: "", date: "", time: "AM" }]);
    alert("Baris baru ditambahkan");
  };

  const handleEdit = () => {
    alert("Mode edit aktif, silakan ubah data langsung pada tabel");
  };

  const handleDelete = () => {
    if (reminders.length > 0) {
      setReminders((prev) => prev.slice(0, -1));
      alert("Baris terakhir dihapus");
    }
  };

  return (
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
          <FiClock size={24} color="white" />
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="bold"
            color="white"
          >
            Reminder
          </Text>
        </HStack>
      </Flex>

      {/* Action Buttons di bawah header */}
      <HStack gap={2} justify="flex-start" mt={3} mb={2}>
        <Button
          onClick={handleAdd}
          bg="green.400"
          color="white"
          borderRadius="xl"
          size="sm"
          _hover={{ bg: "green.500" }}
        >
          <FiPlus style={{ marginRight: 6 }} /> Add
        </Button>
        <Button
          onClick={handleEdit}
          bg="blue.400"
          color="white"
          borderRadius="xl"
          size="sm"
          _hover={{ bg: "blue.500" }}
        >
          <FiEdit style={{ marginRight: 6 }} /> Edit
        </Button>
        <Button
          onClick={handleDelete}
          bg="red.400"
          color="white"
          borderRadius="xl"
          size="sm"
          _hover={{ bg: "red.500" }}
        >
          <FiTrash2 style={{ marginRight: 6 }} /> Delete
        </Button>
      </HStack>

      {/* Reminder List */}
      <Box flex="1" overflowY="auto" p={{ base: 3, md: 4 }}>
        <VStack gap={3} align="stretch">
          {reminders.map((reminder, idx) => (
            <HStack
              key={idx}
              gap={3}
              w="100%"
              align="center"
              justify="space-between"
              flexWrap="nowrap"
            >
              {/* Nama Obat */}
              <NativeSelect
                value={reminder.medicine}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleChange(idx, "medicine", e.target.value)
                }
                bg="white"
                color="black"
                borderRadius="xl"
                fontSize="sm"
                px={3}
                py={2}
                borderWidth="1px"
                borderColor="gray.200"
                minW="30%"
              >
                <option value="" disabled>
                  Pilih Obat
                </option>
                {medicines.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </NativeSelect>

              {/* Tanggal */}
              <Input
                type="date"
                value={reminder.date}
                onChange={(e) => handleChange(idx, "date", e.target.value)}
                bg="white"
                color="black"
                borderRadius="xl"
                fontSize="sm"
                borderColor="gray.200"
                minW="20%"
              />

              {/* Jam AM/PM */}
              <NativeSelect
                value={reminder.time}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleChange(idx, "time", e.target.value)
                }
                bg="white"
                color="black"
                borderRadius="xl"
                fontSize="sm"
                px={3}
                py={2}
                borderWidth="1px"
                borderColor="gray.200"
                minW="20%"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === "AM" ? "A.M" : "P.M"}
                  </option>
                ))}
              </NativeSelect>

              {/* Tombol Set */}
              <Button
                onClick={() => handleSet(idx)}
                bg="#FFAE00"
                color="black"
                borderRadius="xl"
                fontWeight="bold"
                fontSize="sm"
                _hover={{ bg: "#e59c00" }}
                minW="15%"
              >
                Set
              </Button>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Flex>
  );
};

export default Reminder;
