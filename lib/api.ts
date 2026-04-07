import axios from "axios";

export const api = axios.create({
  baseURL: "https://api.bewathiq.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};