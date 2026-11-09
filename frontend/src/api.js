// Talks to the Express and MongoDB backend when the app runs locally.
// GitHub Pages has no backend, so the hosted copy saves bookings in the browser instead.
export const usesDatabase = ["localhost", "127.0.0.1"].includes(location.hostname);
const STORAGE_KEY = "localtrails-bookings";

const samples = [
  { _id: "1", visitorName: "Priya Raman", mobile: "9876500011", category: "Heritage Sites", date: "2026-12-02", status: "Confirmed", fee: 1500 },
  { _id: "2", visitorName: "Arun Kumar", mobile: "9876500022", category: "Beaches", date: "2026-12-05", status: "Planned", fee: 900 },
  { _id: "3", visitorName: "Divya Menon", mobile: "9876500033", category: "Hill Stations", date: "2026-12-09", status: "Completed", fee: 2500 },
];

function loadSaved() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : samples;
}

function save(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const browserStore = {
  async list() {
    return [...loadSaved()].sort((a, b) => a.date.localeCompare(b.date));
  },
  async create(data) {
    save([...loadSaved(), { ...data, fee: Number(data.fee), _id: String(Date.now()) }]);
    return "Tour booked successfully";
  },
  async update(id, data) {
    save(loadSaved().map((r) => (r._id === id ? { ...data, fee: Number(data.fee), _id: id } : r)));
    return "Tour updated successfully";
  },
  async remove(id) {
    save(loadSaved().filter((r) => r._id !== id));
    return "Tour deleted successfully";
  },
};

async function send(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

const databaseStore = {
  list: () => send("/api/bookings", "GET"),
  create: async (data) => (await send("/api/bookings", "POST", data)).message,
  update: async (id, data) => (await send(`/api/bookings/${id}`, "PUT", data)).message,
  remove: async (id) => (await send(`/api/bookings/${id}`, "DELETE")).message,
};

export default usesDatabase ? databaseStore : browserStore;
