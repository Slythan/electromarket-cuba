import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./cart/CarConext"; // Ajusta la ruta si es necesario

export const metadata: Metadata = {
  title: "ElectroMarket Cuba",
  description: "Tu proveedor de confianza",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <CartProvider>
          {/* Aquí puedes meter un <Navbar /> global más adelante */}
          <main className="min-h-screen">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}