/**
 * Compara "última actividad de la otra parte" contra "última vez que yo lo
 * vi", en vez de un booleano leído/no-leído: así el highlight reaparece solo
 * con actividad nueva, sin necesitar un reset explícito en cada revisión.
 */
export function necesitaAtencion(ultimaActividadOtro: Date | null, vistoPorMi: Date | null): boolean {
  if (!ultimaActividadOtro) return false;
  if (!vistoPorMi) return true;
  return ultimaActividadOtro > vistoPorMi;
}
