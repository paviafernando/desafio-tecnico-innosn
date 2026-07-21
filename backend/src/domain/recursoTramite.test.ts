import { tipoMimePermitido } from "./recursoTramite";

describe("tipoMimePermitido", () => {
  it.each(["application/pdf", "image/png", "image/jpeg", "image/webp"])(
    "permite %s",
    (mime) => {
      expect(tipoMimePermitido(mime)).toBe(true);
    },
  );

  it.each(["application/zip", "text/plain", "video/mp4", "application/x-msdownload"])(
    "rechaza %s",
    (mime) => {
      expect(tipoMimePermitido(mime)).toBe(false);
    },
  );
});
