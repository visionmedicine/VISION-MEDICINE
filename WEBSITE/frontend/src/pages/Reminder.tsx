// src/pages/Reminder.tsx
import { useState, useRef, useEffect } from "react";
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
import PageTransition from "@/components/layouts/PageTransition";

type ReminderRow = {
  medicine: string;
  date: string;
  hour: string;
  minute: string;
  isSet?: boolean;
  eventId?: string; // simpan id event dari Google Calendar
};

interface Medicine {
  name: string;
  kandungan: string;
  indikasi: string;
  efekSamping: string;
  dosis: string;
  golongan: string;
}

// ✅ Helper function untuk kapital di setiap kata
const capitalizeWords = (str: string) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "white",
    color: "black",
    borderRadius: "12px",
    borderColor: "#E2E8F0",
    minHeight: "38px",
    height: "38px",
    fontSize: "16px",
    boxShadow: state.isFocused ? "0 0 0 1px #3182CE" : "none",
    "&:hover": { borderColor: "#3182CE" },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "black",
    fontSize: "16px",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "white",
    color: "black",
    borderRadius: "12px",
    overflow: "hidden",
    fontSize: "16px",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#FFAE00" : "white",
    color: "black",
    fontSize: "16px",
    "&:hover": { backgroundColor: "#ffe0a3" },
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "gray",
    fontSize: "16px",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "black",
    fontSize: "16px",
  }),
};

const Reminder = () => {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [medicines, setMedicines] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedReminders = localStorage.getItem("reminders");
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    } else {
      setReminders([
        { medicine: "", date: "", hour: "", minute: "", isSet: false },
      ]);
    }
  }, []);

  useEffect(() => {
    if (reminders.length > 0) {
      localStorage.setItem("reminders", JSON.stringify(reminders));
    }
  }, [reminders]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // fetch daftar obat
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/medicines");
        const data: Medicine[] = await res.json();
        const sorted = data
          .filter((m) => !!m?.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        // ✅ Terapkan capitalizeWords biar "sanmol forte" → "Sanmol Forte"
        setMedicines(sorted.map((m) => capitalizeWords(m.name)));
      } catch (error) {
        console.error("❌ Error fetching medicines:", error);
        setMedicines([]);
      }
    };
    fetchMedicines();
  }, []);

  const medicineOptions = medicines.map((m) => ({ value: m, label: m }));

  const handleChange = (
    index: number,
    field: keyof ReminderRow,
    value: string
  ) => {
    setReminders((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value, isSet: false } : item
      )
    );
  };

  // toggle aktif/nonaktif
  const handleToggleSet = async (index: number) => {
    const r = reminders[index];
    if (!r.medicine || !r.date || !r.hour || !r.minute) {
      alert("⚠️ Harap isi semua data sebelum menyimpan reminder!");
      return;
    }

    if (!r.isSet) {
      // Aktifkan → create event ke backend
      try {
        const res = await fetch("http://localhost:5000/api/reminder/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: "primary",
            summary: r.medicine, // cuma nama obat
            date: r.date,
            hour: r.hour,
            minute: r.minute,
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          setReminders((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? { ...item, isSet: true, eventId: data.eventId }
                : item
            )
          );
          alert(`✅ Reminder diaktifkan untuk ${r.medicine}`);
        } else {
          alert("❌ Gagal membuat reminder di Google Calendar");
        }
      } catch (err) {
        console.error("❌ Error create reminder:", err);
      }
    } else {
      // Nonaktifkan → delete event
      try {
        if (!r.eventId) {
          alert(
            "❌ Event ID tidak ditemukan, tidak bisa hapus dari Google Calendar"
          );
          return;
        }
        const res = await fetch("http://localhost:5000/api/reminder/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: "primary",
            event_id: r.eventId,
          }),
        });
        const data = await res.json();
        if (data?.ok) {
          setReminders((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? { ...item, isSet: false, eventId: undefined }
                : item
            )
          );
          alert(`⚠️ Reminder untuk ${r.medicine} sudah dihapus`);
        }
      } catch (err) {
        console.error("❌ Error delete reminder:", err);
      }
    }
  };

  const handleAdd = () => {
    setReminders((prev) => [
      ...prev,
      { medicine: "", date: "", hour: "", minute: "", isSet: false },
    ]);
  };

  // ⬇️ FIX: delete row juga hapus dari Google Calendar kalau ada eventId
  const handleDeleteRow = async (index: number) => {
    const r = reminders[index];
    if (
      window.confirm(`Apakah yakin ingin menghapus reminder: ${r.medicine}?`)
    ) {
      try {
        if (r.eventId) {
          await fetch("http://localhost:5000/api/reminder/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_email: "primary",
              event_id: r.eventId,
            }),
          });
        }
      } catch (err) {
        console.error("❌ Error delete reminder via delete row:", err);
      }
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

        <Box
          ref={containerRef}
          flex="1"
          overflowY="auto"
          p={{ base: 3, md: 4 }}
        >
          <VStack gap={3} align="stretch">
            {reminders.map((reminder, idx) => (
              <Flex
                key={idx}
                gap={3}
                w="100%"
                align="center"
                flexDirection={{ base: "column", md: "row" }}
                bg={reminder.isSet ? "#445775" : "#2f2f2f"}
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
                        ? {
                            value: reminder.medicine,
                            label: capitalizeWords(reminder.medicine),
                          }
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
                  fontSize="md"
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
                  fontSize="md"
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
                  fontSize="md"
                  borderColor="gray.200"
                  w={{ base: "100%", md: "18%" }}
                  placeholder="Menit (0-59)"
                />

                {/* Toggle & Delete */}
                <Flex
                  align="center"
                  gap={2}
                  justify={{ base: "flex-start", md: "flex-end" }}
                  ml={{ base: 0, md: "auto" }}
                >
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
                  <Text color="white" fontSize="md">
                    {reminder.isSet ? "Aktif" : "Nonaktif"}
                  </Text>
                  <FiTrash2
                    color="white"
                    size={18}
                    style={{ cursor: "pointer", marginLeft: 8 }}
                    onClick={() => handleDeleteRow(idx)}
                  />
                </Flex>
              </Flex>
            ))}

            <Button
              onClick={handleAdd}
              bg="green.600"
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
    </PageTransition>
  );
};

export default Reminder;
