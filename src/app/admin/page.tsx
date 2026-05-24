'use client';
import { useState, useEffect } from 'react';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagen: string;
  categoria: string;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  
  // Estados de formularios
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio: '', descripcion: '', imagen: '', categoria: ''
  });
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  useEffect(() => {
    const prods = localStorage.getItem('electromarket_productos');
    const cats = localStorage.getItem('electromarket_categorias');
    if (prods) setProductos(JSON.parse(prods));
    if (cats) setCategorias(JSON.parse(cats));
  }, []);

  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Tu contraseña única de acceso
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const guardarProductos = (nuevosProds: Producto[]) => {
    setProductos(nuevosProds);
    localStorage.setItem('electromarket_productos', JSON.stringify(nuevosProds));
  };

  const guardarCategorias = (nuevasCats: string[]) => {
    setCategorias(nuevasCats);
    localStorage.setItem('electromarket_categorias', JSON.stringify(nuevasCats));
  };

  const agregarProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.categoria) return;

    const prod: Producto = {
      id: Date.now().toString(),
      nombre: nuevoProducto.nombre,
      precio: parseFloat(nuevoProducto.precio),
      descripcion: nuevoProducto.descripcion,
      imagen: nuevoProducto.imagen || 'https://placehold.co/300',
      categoria: nuevoProducto.categoria
    };

    guardarProductos([...productos, prod]);
    setNuevoProducto({ nombre: '', precio: '', descripcion: '', imagen: '', categoria: '' });
  };

  const eliminarProducto = (id: string) => {
    guardarProductos(productos.filter(p => p.id !== id));
  };

  const agregarCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria || categorias.includes(nuevaCategoria)) return;
    guardarCategorias([...categorias, nuevaCategoria]);
    setNuevaCategoria('');
  };

  const eliminarCat = (catNombre: string) => {
    if (catNombre === "Todos") return;
    guardarCategorias(categorias.filter(c => c !== catNombre));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form onSubmit={manejarLogin} className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full border">
          <h2 className="text-xl font-black text-gray-900 mb-4 text-center">🔐 Acceso al Dashboard</h2>
          <input
            type="password"
            placeholder="Introduce la contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-[#0052cc]"
          />
          <button type="submit" className="w-full bg-[#0052cc] text-white font-bold py-2 rounded-lg text-sm">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-black text-gray-900">🛠️ Panel de Control</h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs font-bold bg-gray-200 px-3 py-1.5 rounded-lg">Cerrar Sesión</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* COLUMNA GESTIÓN CATEGORÍAS */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Añadir Categoría</h3>
              <form onSubmit={agregarCat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Neveras"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="flex-grow border rounded-lg px-3 py-1.5 text-xs focus:outline-[#0052cc]"
                />
                <button type="submit" className="bg-[#0052cc] text-white font-bold text-xs px-4 rounded-lg">➕</button>
              </form>

              <div className="mt-4 space-y-1">
                {categorias.filter(c => c !== "Todos").map(c => (
                  <div key={c} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border">
                    <span>{c}</span>
                    <button onClick={() => eliminarCat(c)} className="text-red-500 font-bold hover:underline">Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA FORMULARIO PRODUCTOS */}
          <div className="md:col-span-2">
            <form onSubmit={agregarProducto} className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2">Añadir Nuevo Producto</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre del Producto"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-xs w-full focus:outline-[#0052cc]"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio ($ USD)"
                  value={nuevoProducto.precio}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-xs w-full focus:outline-[#0052cc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="URL de la Imagen"
                  value={nuevoProducto.imagen}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, imagen: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-xs w-full focus:outline-[#0052cc]"
                />
                <select
                  value={nuevoProducto.categoria}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-xs w-full bg-white focus:outline-[#0052cc]"
                >
                  <option value="">Selecciona Categoría</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <textarea
                placeholder="Descripción del artículo..."
                value={nuevoProducto.descripcion}
                onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                className="border rounded-lg px-3 py-2 text-xs w-full h-20 focus:outline-[#0052cc]"
              />

              <button type="submit" className="w-full bg-[#0052cc] text-white font-bold py-2 rounded-lg text-xs transition-colors hover:bg-[#0033aa]">
                Guardar Producto en Inventario
              </button>
            </form>
          </div>
        </div>

        {/* LISTADO DE ARTÍCULOS */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">Inventario Activo ({productos.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b">
                  <th className="p-3">Imagen</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3"><img src={p.imagen} className="w-8 h-8 object-contain bg-gray-100 rounded" /></td>
                    <td className="p-3 font-bold text-gray-900">{p.nombre}</td>
                    <td className="p-3"><span className="bg-blue-50 text-[#0052cc] font-bold px-2 py-0.5 rounded">{p.categoria}</span></td>
                    <td className="p-3 font-black">${p.precio.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => eliminarProducto(p.id)} className="text-red-600 font-bold hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}