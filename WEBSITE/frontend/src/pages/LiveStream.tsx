// ===============================
// LiveStream.tsx — versi terbaru 2025-10 (Persistent LocalStorage Fix + Rounded Table)
// ===============================

import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import { keyframes, css } from "@emotion/react";
import { useState, useEffect, useRef } from "react";
import PageTransition from "@/components/layouts/PageTransition";

// === Konfigurasi URL backend ===
const streamUrl = import.meta.env.VITE_BACKEND_URL + "/api/livestream/video";
const apiUrl = import.meta.env.VITE_BACKEND_URL + "/api";
const sseUrl = import.meta.env.VITE_BACKEND_URL + "/api/n8n/stream";

// === Animasi efek TV rusak (glitch) ===
const glitch = keyframes`
  0% { clip-path: inset(20% 0 30% 0); transform: skew(0.5deg); }
  100% { clip-path: inset(20% 0 30% 0); transform: skew(0.5deg); }
`;

const glitchStyle = css`
  animation: ${glitch} 1s infinite;
  filter: contrast(200%) brightness(150%) saturate(200%);
`;

// === Animasi blink untuk NO SIGNAL ===
const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 99% { opacity: 0; }
  100% { opacity: 1; }
`;

const blinkStyle = css`
  animation: ${blink} 1s step-start infinite;
`;

interface Detection {
  id: string;
  timestamp: string;
  detections: Array<{ name: string; confidence: number }>;
  nama_obat?: string;
  kandungan?: string;
  indikasi?: string;
  efek_samping?: string;
  dosis?: string;
}

export default function LiveStream() {
  const [isFallback, setIsFallback] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventSourceRef = useRef<EventSource | null>(null);

  const itemsPerPage = 5;

  const breakpointWidths = useBreakpointValue(
    {
      base: {
        no: "5%",
        time: "10%",
        nama: "12%",
        kand: "12%",
        ind: "20%",
        efek: "20%",
        dos: "21%",
      },
      md: {
        no: "5%",
        time: "9%",
        nama: "12%",
        kand: "12%",
        ind: "18%",
        efek: "18%",
        dos: "26%",
      },
    },
    { fallback: "md" }
  );

  const colWidths = breakpointWidths || {
    no: "5%",
    time: "9%",
    nama: "12%",
    kand: "12%",
    ind: "18%",
    efek: "18%",
    dos: "26%",
  };

  const columns = [
    { key: "no", label: "No." },
    { key: "time", label: "Time" },
    { key: "nama", label: "Nama Obat" },
    { key: "kand", label: "Kandungan" },
    { key: "ind", label: "Indikasi" },
    { key: "efek", label: "Efek Samping" },
    { key: "dos", label: "Dosis Pemakaian" },
  ];

  // Reset to first page when detections change
  useEffect(() => {
    setCurrentPage(1);
  }, [detections]);

  const totalPages = Math.ceil(detections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDetections = detections.slice(startIndex, endIndex);

  // === Muat data dari localStorage saat pertama kali ===
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("detections");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          setDetections(parsed);
          console.log("✅ Data loaded from localStorage:", parsed);
        }
      }
    } catch (err) {
      console.error("⚠️ Error reading from localStorage:", err);
    }
  }, []);

  // === Simpan data ke localStorage setiap kali berubah ===
  useEffect(() => {
    if (detections.length > 0) {
      try {
        localStorage.setItem("detections", JSON.stringify(detections));
        console.log("💾 Data saved to localStorage:", detections);
      } catch (err) {
        console.error("⚠️ Error saving to localStorage:", err);
      }
    }
  }, [detections]);

  const handleImgError = () => setIsFallback(true);
  const handleConnect = () => {
    setIsFallback(false);
    setIsConnected(true);
  };
  const handleDisconnect = () => {
    setIsConnected(false);
    setIsFallback(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log("🛑 SSE connection closed");
    }
  };

  const handleClearData = () => {
    if (
      confirm("Apakah Anda yakin ingin menghapus semua data detection history?")
    ) {
      localStorage.removeItem("detections");
      setDetections([]);
    }
  };

  const fetchDetections = async () => {
    try {
      const res = await fetch(`${apiUrl}/detections`);
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort(
          (a: Detection, b: Detection) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setDetections(sorted);
      }
    } catch (e) {
      console.error("Error fetching detections:", e);
    }
  };

  const capitalizeWords = (text: string) =>
    text
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const parseOutputText = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim());
    const parsed: any = {};
    lines.forEach((line) => {
      if (line.startsWith("• Nama Obat:"))
        parsed.nama_obat = capitalizeWords(
          line.replace("• Nama Obat:", "").trim()
        );
      if (line.startsWith("• Kandungan:"))
        parsed.kandungan = line.replace("• Kandungan:", "").trim();
      if (line.startsWith("• Indikasi:"))
        parsed.indikasi = line.replace("• Indikasi:", "").trim();
      if (line.startsWith("• Efek Samping:"))
        parsed.efek_samping = line.replace("• Efek Samping:", "").trim();
      if (line.startsWith("• Dosis Pemakaian:"))
        parsed.dosis = line.replace("• Dosis Pemakaian:", "").trim();
    });
    return parsed;
  };

  // === SSE listener ===
  const connectSSE = () => {
    console.log("🚀 Connecting to SSE:", sseUrl);
    const source = new EventSource(sseUrl);
    eventSourceRef.current = source;

    source.onopen = () => console.log("✅ Connected to SSE stream");
    source.onerror = (err) => {
      console.error("❌ SSE error:", err);
      setTimeout(() => {
        if (isConnected) connectSSE();
      }, 3000);
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🧠 SSE Message:", data);

        let newDetection: Detection | null = null;
        if (Array.isArray(data) && data[0]?.output) {
          const parsed = parseOutputText(data[0].output);
          newDetection = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            detections: [{ name: data[0].output, confidence: 1.0 }],
            ...parsed,
          };
        } else if (data?.output) {
          const parsed = parseOutputText(data.output);
          newDetection = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            detections: [{ name: data.output, confidence: 1.0 }],
            ...parsed,
          };
        } else if (data?.detections) {
          newDetection = {
            id: data.id || Date.now().toString(),
            timestamp: data.timestamp || new Date().toISOString(),
            detections: data.detections,
          };
        }

        if (newDetection) {
          setDetections((prev) => {
            const updated = [newDetection, ...prev];
            localStorage.setItem("detections", JSON.stringify(updated)); // ✅ Simpan langsung
            return updated;
          });
        }
      } catch (e) {
        console.error("⚠️ Error parsing SSE data:", e);
      }
    };
  };

  useEffect(() => {
    if (isConnected) {
      fetchDetections();
      const interval = setInterval(fetchDetections, 5000);
      connectSSE();
      return () => {
        clearInterval(interval);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
          console.log("🛑 SSE disconnected");
        }
      };
    }
  }, [isConnected]);

  return (
    <PageTransition>
      <Box
        p={6}
        pt={3}
        minH="100vh"
        bg="rgba(255,255,255,0.08)"
        color="white"
        borderRadius="2xl"
      >
        {/* === Judul === */}
        <Flex direction="column" align="center" mb={6}>
          <Heading size="2xl" color="white" fontWeight="extrabold">
            Live Stream Detection
          </Heading>
        </Flex>

        {!isConnected ? (
          <Flex direction="column" align="center" justify="center" minH="70vh">
            <Button
              size={{ base: "md", md: "lg" }}
              colorScheme="orange"
              borderRadius="full"
              px={{ base: 6, md: 10 }}
              py={{ base: 4, md: 6 }}
              onClick={handleConnect}
              bg="rgba(255,165,0,0.25)"
              color="white"
              _hover={{ bg: "rgba(255,165,0,0.35)" }}
            >
              CONNECT
            </Button>
            <Text
              mt={2}
              color="rgba(255,255,255,0.85)"
              textAlign="center"
              px={4}
            >
              Klik tombol Connect untuk memulai Live Streaming 📡
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap={4}>
            {/* === Stream Video === */}
            <Box
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="2xl"
              overflow="hidden"
              w="100%"
              bg="black"
              position="relative"
            >
              <img
                src={isFallback ? "/no-signal.png" : streamUrl}
                onError={handleImgError}
                className={isFallback ? glitchStyle.toString() : ""}
                style={{
                  width: "100%",
                  height: "70vh",
                  objectFit: "contain",
                  backgroundColor: "black",
                }}
              />
              {isFallback && (
                <Flex
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  align="center"
                  justify="center"
                  bg="rgba(0,0,0,0.3)"
                >
                  <Heading
                    size="lg"
                    color="white"
                    className={blinkStyle.toString()}
                  >
                    NO SIGNAL
                  </Heading>
                </Flex>
              )}
            </Box>

            {/* Tombol Kontrol */}
            <Flex gap={4}>
              <Button
                size={{ base: "sm", md: "lg" }}
                colorScheme="red"
                borderRadius="full"
                px={{ base: 4, md: 10 }}
                py={{ base: 3, md: 6 }}
                onClick={handleDisconnect}
                bg="rgba(255,0,0,0.25)"
                color="white"
                _hover={{ bg: "rgba(255,0,0,0.35)" }}
              >
                DISCONNECT
              </Button>

              <Button
                size={{ base: "sm", md: "lg" }}
                colorScheme="gray"
                borderRadius="full"
                px={{ base: 4, md: 10 }}
                py={{ base: 3, md: 6 }}
                onClick={handleClearData}
                bg="rgba(255,255,255,0.15)"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.25)" }}
              >
                CLEAR DATA
              </Button>
            </Flex>

            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color="rgba(255,255,255,0.85)"
              textAlign="center"
              px={4}
            >
              Live Streaming diambil dari kamera VISMED Raspberry Pi 5 ‼️
            </Text>

            {/* === Detection History === */}
            <Box
              mt={6}
              w="100%"
              bg="rgba(255,255,255,0.08)"
              borderRadius="2xl"
              p={4}
              border="1px solid rgba(255,255,255,0.15)"
            >
              <Heading
                size="lg"
                mb={4}
                color="white"
                textAlign="center"
                fontWeight="bold"
              >
                Detection History
              </Heading>

              {detections.length === 0 ? (
                <Text color="rgba(255,255,255,0.6)" textAlign="center">
                  No detections yet. Starting stream...
                </Text>
              ) : (
                <>
                  <Box overflowX="auto">
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        color: "white",
                        borderRadius: "12px",
                        overflow: "hidden",
                        fontSize: "0.875rem", // Ukuran font lebih kecil untuk tampilan lebih tipis
                      }}
                    >
                      <thead>
                        <tr>
                          {columns.map((col, idx, arr) => (
                            <th
                              key={col.key}
                              style={{
                                border: "1px solid rgba(255,255,255,0.2)",
                                padding: "5px 8px", // Padding dikurangi untuk membuat tabel lebih tipis
                                textAlign: col.key === "no" ? "center" : "left",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderTopLeftRadius: idx === 0 ? "12px" : "0",
                                borderTopRightRadius:
                                  idx === arr.length - 1 ? "12px" : "0",
                                whiteSpace: "nowrap", // Mencegah wrapping untuk menjaga lebar kolom
                                fontWeight: "bold",
                                width:
                                  colWidths[col.key as keyof typeof colWidths],
                              }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentDetections.map((det, index) => {
                          const displayIndex = startIndex + index + 1;
                          const dateTime = new Date(det.timestamp);
                          const date = dateTime.toLocaleDateString();
                          const time = dateTime.toLocaleTimeString();
                          return (
                            <tr key={det.id}>
                              <td
                                style={{
                                  textAlign: "center",
                                  padding: "5px 8px", // Padding dikurangi untuk baris data
                                  border: "1px solid rgba(255,255,255,0.1)", // Border lebih tipis untuk data
                                  width: colWidths.no,
                                }}
                              >
                                {displayIndex}
                              </td>
                              <td
                                style={{
                                  padding: "5px 8px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  width: colWidths.time,
                                }}
                              >
                                {date},<br />
                                {time}
                              </td>
                              <td
                                style={{
                                  padding: "5px 8px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  width: colWidths.nama,
                                }}
                              >
                                {det.nama_obat || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "5px 8px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  width: colWidths.kand,
                                }}
                              >
                                {det.kandungan || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "5px 8px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  width: colWidths.ind,
                                }}
                              >
                                {det.indikasi || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "5px 8px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  width: colWidths.efek,
                                }}
                              >
                                {det.efek_samping || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "5px 8px",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  width: colWidths.dos,
                                }}
                              >
                                {det.dosis || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <Flex justify="center" mt={4} gap={4}>
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        bg="rgba(255,255,255,0.15)"
                        color="white"
                        _hover={{ bg: "rgba(255,255,255,0.25)" }}
                      >
                        Previous
                      </Button>
                      <Text color="rgba(255,255,255,0.85)" alignSelf="center">
                        Page {currentPage} of {totalPages}
                      </Text>
                      <Button
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        bg="rgba(255,255,255,0.15)"
                        color="white"
                        _hover={{ bg: "rgba(255,255,255,0.25)" }}
                      >
                        Next
                      </Button>
                    </Flex>
                  )}
                </>
              )}
            </Box>
          </Flex>
        )}
      </Box>
    </PageTransition>
  );
}
