import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0052cc',       // Azul principal de ElectromarketCuba
          darkBlue: '#0033aa',   // Azul oscuro para hovers y botones
          lightBg: '#f4f7fc',    // Fondo grisáceo claro estilo Thor/Plantilla
          textDark: '#1e293b',   // Gris oscuro para descripciones y títulos
          accent: '#00e5ff',     // Azul cian brillante para detalles
        }
      }
    },
  },
  plugins: [],
};
export default config;