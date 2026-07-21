const TIPOS_MIME_PERMITIDOS = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export function tipoMimePermitido(tipoMime: string): boolean {
  return TIPOS_MIME_PERMITIDOS.has(tipoMime);
}
