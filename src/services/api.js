import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/api"
    : "https://speech-to-text-backend-mwst.onrender.com/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
});

// 1. GET ALL TRANSCRIPTIONS
export const getTranscriptions = async () => {
  const response = await api.get("/transcriptions");
  return response.data;
};

// 2. GET TRANSCRIPTION BY ID
export const getTranscriptionById = async (id) => {
  const response = await api.get(`/transcriptions/${id}`);
  return response.data;
};

// 3. CREATE TRANSCRIPTION RECORD (CRUD)
export const createTranscription = async (data) => {
  const response = await api.post("/transcriptions", data);
  return response.data;
};

// 4. UPDATE TRANSCRIPTION RECORD (CRUD)
export const updateTranscription = async (id, data) => {
  const response = await api.put(`/transcriptions/${id}`, data);
  return response.data;
};

// 5. DELETE TRANSCRIPTION RECORD (CRUD)
export const deleteTranscription = async (id) => {
  const response = await api.delete(`/transcriptions/${id}`);
  return response.data;
};

// 6. PROXY AUDIO TO AI SERVICE & AUTO-SAVE TO DB
export const transcribeAudioFile = async ({
  audioBase64,
  format = "wav",
  language = null,
  title = null,
  duration = 0,
}) => {
  const response = await api.post("/transcriptions/transcribe", {
    audioBase64,
    format,
    language,
    title,
    duration,
  });
  return response.data;
};

export default api;
