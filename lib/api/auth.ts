import axios from "axios";

const api = axios.create({
  baseURL: "https://api.bewathiq.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};
