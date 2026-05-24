"use client";
import { useCart, Product } from "./cart/CarConext";

// Productos demo (Simulando lo que vendrá de la base de datos)
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Inversor Híbrido VEVOR 3000W",
    price: 690.0,
    description: "Alta frecuencia, 24V a 120V MPPT 100A con WiFi Off Grid.",
    image: "https://via.placeholder.com/300", // Cambia por fotos reales luego
    category: "Energía",
  },
  {
    id: "2",
    name: "Estación de Energía EcoFlow DELTA 2",
    price: 645.0,
    description: "Batería LiFePO4 de 1024Wh, expandible hasta 3kWh.",
    image: "https://via.placeholder.com/300",
    category: "Energía",
  },
  {
    id: "3",
    name: "Laptop HP 15.6\" Touch Intel i7",
    price: 689.0,
    description: "16GB RAM, 512GB SSD - Plateada corporativa.",
    image: "https://via.placeholder.com/300",
    category: "Computadoras",
  },
];

export default function HomePage() {
  const { addToCart, cart, sendToWhatsApp, getCartTotal } = useCart();

  // Cambia esto por tu número real con código de país (ej: 5350000000 para Cuba)
  const WHATSAPP_PHONE = "5351253413"; 

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <header className="flex justify-between items-center border-b pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">ElectroMarket Cuba</h1>
          <p className="text-slate-500 text-sm">Inspirado en Thor Provider</p>
        </div>
        
        {/* Widget Flotante del Carrito */}
        <div className="bg-white border p-4 rounded-xl shadow-sm flex flex-col items-end">
          <span className="font-semibold text-sm">🛒 Carrito ({cart.reduce((a, b) => a + b.quantity, 0)} ítems)</span>
          <span className="text-lg font-bold text-emerald-600">${getCartTotal().toFixed(2)}</span>
          {cart.length > 0 && (
            <button
              onClick={() => sendToWhatsApp(WHATSAPP_PHONE)}
              className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-md active:scale-95"
            >
              Comprar por WhatsApp →
            </button>
          )}
        </div>
      </header>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <div key={product.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="aspect-square bg-slate-100 relative">
              {/* Espacio para imagen */}
              <img src={product.image} alt={product.name} className="w-full h-full object-cover"/>
              <span className="absolute top-3 left-3 bg-blue-900 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {product.category}
              </span>
            </div>
            
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1">{product.name}</h3>
              <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-grow">{product.description}</p>
              
              <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                <span className="text-2xl font-black text-slate-900">${product.price.toFixed(2)}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}