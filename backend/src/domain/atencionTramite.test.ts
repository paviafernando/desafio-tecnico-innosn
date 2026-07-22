import { necesitaAtencion } from "./atencionTramite";

describe("necesitaAtencion", () => {
  it("necesita atención si nunca se vio y la otra parte ya actuó", () => {
    expect(necesitaAtencion(new Date("2026-01-01"), null)).toBe(true);
  });

  it("no necesita atención si la otra parte nunca actuó, aunque nunca se haya visto", () => {
    expect(necesitaAtencion(null, null)).toBe(false);
  });

  it("necesita atención si la otra parte actuó después de la última vez que se vio", () => {
    const vistoEn = new Date("2026-01-01T00:00:00Z");
    const actividadOtro = new Date("2026-01-02T00:00:00Z");
    expect(necesitaAtencion(actividadOtro, vistoEn)).toBe(true);
  });

  it("no necesita atención si ya se vio después de la última actividad de la otra parte", () => {
    const actividadOtro = new Date("2026-01-01T00:00:00Z");
    const vistoEn = new Date("2026-01-02T00:00:00Z");
    expect(necesitaAtencion(actividadOtro, vistoEn)).toBe(false);
  });
});
