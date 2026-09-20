import qrcode

contenido = "https://www.kcn-tech.com"

qr = qrcode.QRCode(
    version=1,
    # Cambiado a ERROR_CORRECT_H (Soporta hasta ~30% de daño o falta de contraste)
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4,
)

qr.add_data(contenido)
# El fit=True es clave aquí, ya que al aumentar el error, el QR necesitará 
# crecer automáticamente en tamaño (versión) para albergar los datos extra.
qr.make(fit=True)

imagen_qr = qr.make_image(fill_color="white", back_color="transparent")

nombre_archivo = "qr_blanco_maxima_coincidencia.png"
imagen_qr.save(nombre_archivo)

print(f"¡Listo! QR guardado con máxima corrección de errores.")