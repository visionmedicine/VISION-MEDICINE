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
  Heading,
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
    backgroundColor: "rgba(255,255,255,0.9)",
    color: "black",
    borderRadius: "12px",
    borderColor: "rgba(255,255,255,0.2)",
    minHeight: "38px",
    height: "38px",
    fontSize: "16px",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(255,165,0,0.5)" : "none",
    "&:hover": { borderColor: "rgba(255,165,0,0.5)" },
    backdropFilter: "blur(10px)",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "black",
    fontSize: "16px",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(255,255,255,0.9)",
    color: "black",
    borderRadius: "12px",
    overflow: "hidden",
    fontSize: "16px",
    backdropFilter: "blur(10px)",
    zIndex: 9999,
  }),
  menuPortal: (provided: any) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(255,165,0,0.25)"
      : "rgba(255,255,255,0.9)",
    color: "black",
    fontSize: "16px",
    "&:hover": { backgroundColor: "rgba(255,165,0,0.2)" },
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "gray.500",
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

  const handleChange = async (
    index: number,
    field: keyof ReminderRow,
    value: string
  ) => {
    setReminders((prev) => {
      const item = prev[index];
      let updated = [...prev];

      // ✅ Jika sebelumnya aktif dan ada eventId → hapus dari Google & Supabase
      if (item.isSet && item.eventId) {
        fetch("http://localhost:5000/api/reminder/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: "primary",
            event_id: item.eventId,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data?.ok) {
              console.error("❌ Gagal hapus event saat field berubah:", data);
            } else {
              console.log(
                "🗑 Event terhapus karena field berubah:",
                item.eventId
              );
            }
          })
          .catch((err) =>
            console.error("❌ Error hapus event saat field berubah:", err)
          );
      }

      // ✅ Update state lokal → reset toggle & buang eventId
      updated[index] = {
        ...item,
        [field]: value,
        isSet: false,
        eventId: undefined,
      };
      return updated;
    });
  };

  // Toggle aktif/nonaktif
  const handleToggleSet = async (index: number) => {
    const r = reminders[index];
    if (!r.medicine || !r.date || !r.hour || !r.minute) {
      alert("⚠️ Harap isi semua data sebelum menyimpan reminder!");
      return;
    }

    try {
      if (r.isSet) {
        if (r.eventId) {
          console.log("🗑 Hapus event via toggle OFF:", r.eventId);
          const delRes = await fetch(
            "http://localhost:5000/api/reminder/delete",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_email: "primary",
                event_id: r.eventId,
              }),
            }
          );
          const delData = await delRes.json();
          if (!delData?.ok) {
            alert("❌ Gagal menghapus event di Google/Supabase");
            return;
          }
        }

        setReminders((prev) =>
          prev.map((item, idx) =>
            idx === index ? { ...item, isSet: false, eventId: undefined } : item
          )
        );
        alert(`⚠️ Reminder untuk ${r.medicine} dinonaktifkan`);
      } else {
        console.log("➕ Create event:", r);
        const res = await fetch("http://localhost:5000/api/reminder/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: "primary",
            summary: r.medicine,
            date: r.date,
            hour: r.hour,
            minute: r.minute,
            active: true,
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
      }
    } catch (err) {
      console.error("❌ Error toggle reminder:", err);
    }
  };

  const handleAdd = () => {
    setReminders((prev) => [
      ...prev,
      { medicine: "", date: "", hour: "", minute: "", isSet: false },
    ]);
  };

  const handleDeleteRow = async (index: number) => {
    const r = reminders[index];
    if (
      window.confirm(`Apakah yakin ingin menghapus reminder: ${r.medicine}?`)
    ) {
      try {
        if (r.eventId) {
          console.log("🗑 Delete row + event:", r.eventId);
          const delRes = await fetch(
            "http://localhost:5000/api/reminder/delete",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_email: "primary",
                event_id: r.eventId,
                active: false,
              }),
            }
          );
          const delData = await delRes.json();
          if (!delData?.ok) {
            alert("❌ Gagal menghapus event di Google/Supabase");
            return;
          }
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
            <FiClock size={28} color="#FFA500" />
            <Heading
              fontSize={{ base: "2xl", md: "3xl" }}
              bgGradient="linear(to-r, orange.300, yellow.400)"
              bgClip="text"
              fontWeight="extrabold"
              letterSpacing="wide"
              color="rgba(255,255,255,0.85)"
            >
              Reminder
            </Heading>
          </HStack>
          <Text
            mt={3}
            fontSize={{ base: "md", md: "lg" }}
            textAlign="center"
            color="rgba(255,255,255,0.85)"
            maxW="90%"
          >
            Atur jadwal minum obat Anda dengan mudah
          </Text>
        </Box>

        <Box
          ref={containerRef}
          flex="1"
          borderRadius="2xl"
          border="1px solid rgba(255,255,255,0.15)"
          boxShadow="0 8px 24px rgba(255,165,0,0.15)"
          backdropFilter="blur(10px)"
          overflow="hidden"
          bg="rgba(255,255,255,0.08)"
          position="relative"
          p={{ base: 3, md: 4 }}
          maxH={{ base: "calc(100vh - 200px)", md: "calc(100vh - 200px)" }}
          overflowY="auto"
        >
          <VStack gap={3} align="stretch">
            {reminders.map((reminder, idx) => (
              <Flex
                key={idx}
                gap={3}
                w="100%"
                align="center"
                flexDirection={{ base: "column", md: "row" }}
                bg={
                  reminder.isSet
                    ? "rgba(68,87,117,0.6)"
                    : "rgba(255,255,255,0.08)"
                }
                color="white"
                px={{ base: 3, md: 4 }}
                py={{ base: 3, md: 3 }}
                borderRadius="xl"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
                boxShadow="sm"
                fontSize={{ base: "sm", md: "md" }}
                backdropFilter="blur(10px)"
                border="1px solid rgba(255,255,255,0.2)"
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
                    menuPortalTarget={document.body}
                  />
                </Box>

                <Input
                  type="date"
                  value={reminder.date}
                  onChange={(e) => handleDateChange(idx, e.target.value)}
                  bg="rgba(255,255,255,0.9)"
                  color="black"
                  borderRadius="12px"
                  fontSize="md"
                  border="1px solid rgba(255,255,255,0.3)"
                  w={{ base: "100%", md: "20%" }}
                  _placeholder={{ color: "gray.500" }}
                  _focus={{ boxShadow: "0 0 0 1px rgba(255,165,0,0.5)" }}
                />

                <Input
                  type="text"
                  inputMode="numeric"
                  value={reminder.hour}
                  onChange={(e) => handleHourChange(idx, e.target.value)}
                  bg="rgba(255,255,255,0.9)"
                  color="black"
                  borderRadius="12px"
                  fontSize="md"
                  border="1px solid rgba(255,255,255,0.3)"
                  w={{ base: "100%", md: "18%" }}
                  placeholder="Jam (0-23)"
                  _placeholder={{ color: "gray.500" }}
                  _focus={{ boxShadow: "0 0 0 1px rgba(255,165,0,0.5)" }}
                />

                <Input
                  type="text"
                  inputMode="numeric"
                  value={reminder.minute}
                  onChange={(e) => handleMinuteChange(idx, e.target.value)}
                  bg="rgba(255,255,255,0.9)"
                  color="black"
                  borderRadius="12px"
                  fontSize="md"
                  border="1px solid rgba(255,255,255,0.3)"
                  w={{ base: "100%", md: "18%" }}
                  placeholder="Menit (0-59)"
                  _placeholder={{ color: "gray.500" }}
                  _focus={{ boxShadow: "0 0 0 1px rgba(255,165,0,0.5)" }}
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
                        backgroundColor: reminder.isSet
                          ? "rgba(255,165,0,0.65)"
                          : "rgba(255,255,255,0.2)",
                        borderRadius: 34,
                        transition: ".4s",
                        border: "1px solid rgba(255,255,255,0.2)",
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
              bg="rgba(255,165,0,0.25)"
              color="white"
              borderRadius="xl"
              size="sm"
              w={{ base: "100%", md: "fit-content" }}
              border="1px solid rgba(255,255,255,0.2)"
              _hover={{
                bg: "rgba(255,165,0,0.35)",
                boxShadow: "0 8px 24px rgba(255,165,0,0.25)",
              }}
              backdropFilter="blur(10px)"
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
