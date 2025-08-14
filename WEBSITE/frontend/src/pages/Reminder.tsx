import { useState } from "react";
import {
  Box,
  Flex,
  VStack,
  Text,
  HStack,
  Input,
  Button,
} from "@chakra-ui/react";
import { FiClock, FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import Select from "react-select";

type ReminderRow = {
  medicine: string;
  date: string;
  hour: string; // Jam 0-23
  minute: string; // Menit 0-59
};

const medicines = [
  "Paracetamol",
  "Amoxicillin",
  "Ibuprofen",
  "Vitamin C",
  "Cefixime",
  "Metformin",
  "Simvastatin",
  "Omeprazole",
] as const;

const medicineOptions = medicines.map((m) => ({ value: m, label: m }));

// Custom styles untuk react-select agar teks hitam dan kotak seragam
const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "white",
    color: "black",
    borderRadius: "12px", // sesuaikan borderRadius Chakra
    borderColor: "#E2E8F0", // border warna sama seperti Input Chakra
    minHeight: "38px", // sesuaikan tinggi
    height: "38px",
    boxShadow: state.isFocused ? "0 0 0 1px #3182CE" : "none", // fokus seperti Chakra
    "&:hover": {
      borderColor: "#3182CE",
    },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "black",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "white",
    color: "black",
    borderRadius: "12px",
    overflow: "hidden",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#FFAE00" : "white",
    color: "black",
    "&:hover": {
      backgroundColor: "#ffe0a3",
    },
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "gray",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "black",
  }),
};

const formatDateWithMonthName = (value: string) => {
  if (!value) return "";
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const [year, month, day] = value.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${monthNames[monthIndex]} ${year}`;
};

const Reminder = () => {
  const [reminders, setReminders] = useState<ReminderRow[]>([
    { medicine: "", date: "", hour: "", minute: "" },
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

    if (!r.medicine || !r.date || !r.hour || !r.minute) {
      alert("⚠️ Harap isi semua data sebelum menyimpan reminder!");
      return;
    }

    alert(
      `✅ Reminder diset: ${r.medicine}, Tanggal ${formatDateWithMonthName(
        r.date
      )}, Jam ${r.hour.padStart(2, "0")}:${r.minute.padStart(2, "0")}`
    );
  };

  const handleAdd = () => {
    setReminders((prev) => [
      ...prev,
      { medicine: "", date: "", hour: "", minute: "" },
    ]);
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

  const handleHourChange = (index: number, value: string) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    if (onlyNumbers === "") {
      handleChange(index, "hour", "");
      return;
    }
    const num = parseInt(onlyNumbers, 10);
    if (num >= 0 && num <= 23) {
      handleChange(index, "hour", onlyNumbers);
    }
  };

  const handleMinuteChange = (index: number, value: string) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    if (onlyNumbers === "") {
      handleChange(index, "minute", "");
      return;
    }
    const num = parseInt(onlyNumbers, 10);
    if (num >= 0 && num <= 59) {
      handleChange(index, "minute", onlyNumbers);
    }
  };

  const handleDateChange = (index: number, value: string) => {
    handleChange(index, "date", value);
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

      {/* Action Buttons */}
      <HStack gap={2} justify="flex-start" mt={3} mb={2} flexWrap="wrap">
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
            <Flex
              key={idx}
              gap={3}
              w="100%"
              align="center"
              justify="space-between"
              flexDirection={{ base: "column", md: "row" }}
              bg="#2f2f2f"
              p={3}
              borderRadius="xl"
              borderBottom="4px solid"
              borderColor="gray.600"
            >
              {/* Obat dengan Search */}
              <Box w={{ base: "100%", md: "25%" }}>
                <Select
                  options={medicineOptions}
                  value={
                    reminder.medicine
                      ? { value: reminder.medicine, label: reminder.medicine }
                      : null
                  }
                  onChange={(selected) =>
                    handleChange(idx, "medicine", selected?.value || "")
                  }
                  placeholder="Pilih Obat"
                  isClearable
                  styles={customSelectStyles}
                />
              </Box>

              {/* Tanggal */}
              <Input
                type="date"
                value={reminder.date}
                onChange={(e) => handleDateChange(idx, e.target.value)}
                bg="white"
                color="black"
                borderRadius="12px"
                fontSize="sm"
                borderColor="gray.200"
                w={{ base: "100%", md: "20%" }}
              />

              {/* Jam */}
              <Input
                type="text"
                inputMode="numeric"
                value={reminder.hour}
                onChange={(e) => handleHourChange(idx, e.target.value)}
                bg="white"
                color="black"
                borderRadius="12px"
                fontSize="sm"
                borderColor="gray.200"
                w={{ base: "100%", md: "15%" }}
                placeholder="Jam (0-23)"
              />

              {/* Menit */}
              <Input
                type="text"
                inputMode="numeric"
                value={reminder.minute}
                onChange={(e) => handleMinuteChange(idx, e.target.value)}
                bg="white"
                color="black"
                borderRadius="12px"
                fontSize="sm"
                borderColor="gray.200"
                w={{ base: "100%", md: "15%" }}
                placeholder="Menit (0-59)"
              />

              {/* Tombol Set */}
              <Button
                onClick={() => handleSet(idx)}
                bg="#FFAE00"
                color="black"
                borderRadius="12px"
                fontWeight="bold"
                fontSize="sm"
                _hover={{ bg: "#e59c00" }}
                w={{ base: "100%", md: "15%" }}
              >
                Set
              </Button>
            </Flex>
          ))}
        </VStack>
      </Box>
    </Flex>
  );
};

export default Reminder;
