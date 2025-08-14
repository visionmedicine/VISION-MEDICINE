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
import { FiClock, FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "react-select";

type ReminderRow = {
  medicine: string;
  date: string;
  hour: string;
  minute: string;
  isSet?: boolean;
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

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "white",
    color: "black",
    borderRadius: "12px",
    borderColor: "#E2E8F0",
    minHeight: "38px",
    height: "38px",
    boxShadow: state.isFocused ? "0 0 0 1px #3182CE" : "none",
    "&:hover": { borderColor: "#3182CE" },
  }),
  singleValue: (provided: any) => ({ ...provided, color: "black" }),
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
    "&:hover": { backgroundColor: "#ffe0a3" },
  }),
  placeholder: (provided: any) => ({ ...provided, color: "gray" }),
  input: (provided: any) => ({ ...provided, color: "black" }),
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
    { medicine: "", date: "", hour: "", minute: "", isSet: false },
  ]);

  const handleChange = (
    index: number,
    field: keyof ReminderRow,
    value: string
  ) => {
    setReminders((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? ({ ...item, [field]: value, isSet: false } as ReminderRow)
          : item
      )
    );
  };

  const handleToggleSet = (index: number) => {
    const r = reminders[index];
    if (!r.medicine || !r.date || !r.hour || !r.minute) {
      alert("⚠️ Harap isi semua data sebelum menyimpan reminder!");
      return;
    }
    const newValue = !r.isSet;
    setReminders((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, isSet: newValue } : item
      )
    );

    alert(
      newValue
        ? `✅ Reminder diaktifkan: ${
            r.medicine
          }, Tanggal ${formatDateWithMonthName(r.date)}, Jam ${r.hour.padStart(
            2,
            "0"
          )}:${r.minute.padStart(2, "0")}`
        : `⚠️ Reminder dinonaktifkan: ${
            r.medicine
          }, Tanggal ${formatDateWithMonthName(r.date)}, Jam ${r.hour.padStart(
            2,
            "0"
          )}:${r.minute.padStart(2, "0")}`
    );
  };

  const handleAdd = () => {
    setReminders((prev) => [
      ...prev,
      { medicine: "", date: "", hour: "", minute: "", isSet: false },
    ]);
    alert("Baris baru ditambahkan");
  };

  const handleDeleteRow = (index: number) => {
    const r = reminders[index];
    if (
      window.confirm(`Apakah yakin ingin menghapus reminder: ${r.medicine}?`)
    ) {
      setReminders((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleHourChange = (index: number, value: string) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    if (onlyNumbers === "") return handleChange(index, "hour", "");
    const num = parseInt(onlyNumbers, 10);
    if (num >= 0 && num <= 23) handleChange(index, "hour", onlyNumbers);
  };

  const handleMinuteChange = (index: number, value: string) => {
    const onlyNumbers = value.replace(/[^0-9]/g, "");
    if (onlyNumbers === "") return handleChange(index, "minute", "");
    const num = parseInt(onlyNumbers, 10);
    if (num >= 0 && num <= 59) handleChange(index, "minute", onlyNumbers);
  };

  const handleDateChange = (index: number, value: string) => {
    const [year] = value.split("-");
    if (year.length > 4) return;
    handleChange(index, "date", value);
  };

  return (
    <Flex
      direction="column"
      h="100vh"
      w="100%"
      bg="#242424"
      p={{ base: 4, md: 6 }}
    >
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
              bg={reminder.isSet ? "#38A169" : "#2f2f2f"}
              p={3}
              borderRadius="xl"
              borderBottom="4px solid"
              borderColor="gray.600"
            >
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
                w={{ base: "100%", md: "18%" }}
                placeholder="Jam (0-23)"
              />

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
                w={{ base: "100%", md: "18%" }}
                placeholder="Menit (0-59)"
              />

              <Flex align="center" gap={2} ml="auto">
                {/* Toggle Switch */}
                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: 50,
                    height: 26,
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={reminder.isSet}
                    onChange={() => handleToggleSet(idx)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: reminder.isSet ? "#FFAE00" : "#ccc",
                      borderRadius: 34,
                      transition: ".4s",
                    }}
                  ></span>
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: 22,
                      width: 22,
                      left: reminder.isSet ? 26 : 2,
                      bottom: 2,
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: ".4s",
                    }}
                  ></span>
                </label>
                <Text color="white" fontSize="sm">
                  {reminder.isSet ? "Aktif" : "Nonaktif"}
                </Text>

                {/* Delete icon menempel ke kanan */}
                <FiTrash2
                  color="white"
                  size={18}
                  style={{ cursor: "pointer", marginLeft: 8 }}
                  onClick={() => handleDeleteRow(idx)}
                />
              </Flex>
            </Flex>
          ))}

          {/* Tombol Add di bawah semua baris */}
          <Button
            onClick={handleAdd}
            bg="green.400"
            color="white"
            borderRadius="xl"
            size="sm"
            w={{ base: "100%", md: "fit-content" }}
            _hover={{ bg: "green.500" }}
          >
            <FiPlus style={{ marginRight: 6 }} /> Add
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Reminder;
