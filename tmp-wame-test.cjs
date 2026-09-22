// Comprueba con Node (fetch) qué devuelve WhatsApp para la URL que generamos.
const EMOJI = '\u{1F6CD}\uFE0F';
const MENSAJE = `${EMOJI} NUEVO PEDIDO - ElectroMarket\n\n• \u{1F464} Cliente: José Pérez\n• \u{1F4DE} Teléfono: 058244561`;
const url = `https://wa.me/5358244561?text=${encodeURIComponent(MENSAJE)}`;

console.log('URL:', url.slice(0, 110) + '...');
console.log('encodeURIComponent deja el emoji como:', encodeURIComponent(EMOJI));
console.log('U+FFFD en la URL que generamos:', (url.match(/%EF%BF%BD/g) || []).length);

(async () => {
  for (const target of [url, `https://api.whatsapp.com/send?text=${encodeURIComponent(MENSAJE)}`]) {
    try {
      const res = await fetch(target, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const body = await res.text();
      const bodyBytes = Buffer.from(body, 'utf8');
      console.log(`\n=== ${target.slice(0, 60)}...`);
      console.log('  status:', res.status, '| final:', res.url.slice(0, 80));
      console.log('  cuerpo: bytes', bodyBytes.length, '| contiene emoji crudo:', body.includes(EMOJI));
      console.log('  U+FFFD en el cuerpo:', (body.match(/\uFFFD/g) || []).length, '| "?" de reemplazo:', (body.match(/\?{2,}/g) || []).length);
      // Enlaces a la app que trae la página (lo que abre el telefono)
      const appLinks = [...body.matchAll(/whatsapp:\/\/[^"'\\\s<]+/g)].map((m) => m[0]);
      const sendLinks = [...body.matchAll(/https:\/\/api\.whatsapp\.com\/send[^"'\\\s<]*/g)].map((m) => m[0]);
      console.log('  enlaces whatsapp:// encontrados:', appLinks.length);
      if (appLinks[0]) {
        const link = appLinks[0];
        console.log('    ejemplo:', link.slice(0, 120));
        console.log('    emoji intacto en el enlace:', link.includes('%F0%9F%9B%8D') || link.includes(EMOJI));
        console.log('    U+FFFD en el enlace:', (link.match(/%EF%BF%BD|\uFFFD/g) || []).length);
      }
      if (sendLinks[0]) console.log('  api/send:', sendLinks[0].slice(0, 120));
    } catch (err) {
      console.log(`\n=== ${target.slice(0, 60)}... -> ERROR: ${err.message}`);
    }
  }
})();