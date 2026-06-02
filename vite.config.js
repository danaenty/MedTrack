import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Replace "medtrack" with your exact GitHub repository name
  base: "/MedTrack/",
});
