import { defineConfig } from "vite";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about/index.html"),
        contact: resolve(__dirname, "contact/index.html"),
        pricing: resolve(__dirname, "pricing/index.html"),
        chat: resolve(__dirname, "chat/index.html"),
        users: resolve(__dirname, "users/index.html"),
        todos: resolve(__dirname, "todos/index.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
});
