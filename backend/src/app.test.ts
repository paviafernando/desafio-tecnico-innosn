import "dotenv/config";
import { Pool } from "pg";
import request from "supertest";
import type { Express } from "express";
import { crearApp } from "./app";
import { BcryptHashService } from "./adapters/seguridad/bcryptHashService";

const esquemaValido = {
  campos: [
    { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
    { id: "dni", etiqueta: "DNI", tipo: "texto", requerido: true },
    { id: "email", etiqueta: "Email", tipo: "email", requerido: true },
    { id: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
    { id: "domicilio", etiqueta: "Domicilio", tipo: "texto", requerido: true },
    { id: "motivo", etiqueta: "Motivo", tipo: "texto_largo", requerido: true },
    { id: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha", requerido: true },
    { id: "comprobante", etiqueta: "Comprobante", tipo: "archivo", requerido: true },
  ],
};

const flujoValido = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["aprobado", "rechazado"],
    aprobado: [],
    rechazado: [],
  },
};

describe("Flujo completo de un trámite (Supertest contra la app real + PostgreSQL real)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let app: Express;
  let tokenAdmin: string;

  beforeEach(async () => {
    await pool.query("TRUNCATE tramites, tipos_tramite, admins RESTART IDENTITY CASCADE");

    const hasher = new BcryptHashService(4);
    const passwordHash = await hasher.hashear("secreta123");
    await pool.query(
      `INSERT INTO admins (email, password_hash, nombre) VALUES ($1, $2, $3)`,
      ["admin-test@sannicolas.gob.ar", passwordHash, "Admin de San Nicolás"],
    );

    app = crearApp(pool);

    const login = await request(app)
      .post("/api/admin/auth/login")
      .send({ email: "admin-test@sannicolas.gob.ar", password: "secreta123" });
    tokenAdmin = login.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("rechaza acceder a un endpoint protegido sin token", async () => {
    const respuesta = await request(app).get("/api/admin/tipos-tramite");
    expect(respuesta.status).toBe(401);
  });

  it("permite loguearse como admin con credenciales correctas", async () => {
    expect(tokenAdmin).toEqual(expect.any(String));
  });

  it("rechaza con 400 un body mal formado antes de llegar al service", async () => {
    const respuesta = await request(app)
      .post("/api/admin/tipos-tramite")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nombre: "Falta todo lo demás" });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe("Datos inválidos");
  });

  it("recorre el flujo completo: crear tipo, publicarlo, cargar trámite como vecino, cambiar estado y comentar", async () => {
    const crearTipo = await request(app)
      .post("/api/admin/tipos-tramite")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombre: "Inscripción a becas deportivas",
        descripcion: "Inscripción de menores a becas deportivas municipales",
        esquemaFormulario: esquemaValido,
        flujoEstados: flujoValido,
        categoria: "Deportes",
        costo: "Gratuito",
      });
    expect(crearTipo.status).toBe(201);
    expect(crearTipo.body.estado).toBe("borrador");
    const tipoTramiteId = crearTipo.body.id;

    const publicar = await request(app)
      .post(`/api/admin/tipos-tramite/${tipoTramiteId}/publicar`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send();
    expect(publicar.status).toBe(200);
    expect(publicar.body.estado).toBe("publicado");

    const identidades = await request(app).get("/api/ciudadano/identidades");
    expect(identidades.status).toBe(200);
    expect(identidades.body.length).toBeGreaterThan(0);
    const identidadElegida = identidades.body[0];

    const sesionCiudadano = await request(app)
      .post("/api/ciudadano/auth/sesion")
      .send({ dni: identidadElegida.dni });
    expect(sesionCiudadano.status).toBe(200);
    const tokenCiudadano = sesionCiudadano.body.token;

    const subirArchivo = await request(app)
      .post("/api/archivos")
      .set("Authorization", `Bearer ${tokenCiudadano}`)
      .attach("archivo", Buffer.from("contenido de la ficha médica"), "ficha-medica.pdf");
    expect(subirArchivo.status).toBe(201);
    expect(subirArchivo.body.claveAlmacenamiento).toEqual(expect.any(String));

    const crearTramite = await request(app)
      .post("/api/tramites")
      .set("Authorization", `Bearer ${tokenCiudadano}`)
      .send({
        tipoTramiteId,
        datosFormulario: {
          nombre: identidadElegida.nombre,
          dni: identidadElegida.dni,
          email: identidadElegida.email,
          telefono: "3364000000",
          domicilio: "Calle Falsa 123",
          motivo: "Quiero anotarme",
          fecha_nacimiento: "2015-01-01",
          comprobante: subirArchivo.body.claveAlmacenamiento,
        },
      });
    expect(crearTramite.status).toBe(201);
    expect(crearTramite.body.estadoActual).toBe("pendiente");
    const tramiteId = crearTramite.body.id;

    const detalleParaVecino = await request(app)
      .get(`/api/tramites/${tramiteId}`)
      .set("Authorization", `Bearer ${tokenCiudadano}`);
    expect(detalleParaVecino.status).toBe(200);
    expect(detalleParaVecino.body.tipoTramiteEsquemaFormulario).toEqual(esquemaValido);
    expect(detalleParaVecino.body.tipoTramiteVersion).toBeUndefined();

    const otraIdentidad = identidades.body[1];
    const sesionOtroCiudadano = await request(app)
      .post("/api/ciudadano/auth/sesion")
      .send({ dni: otraIdentidad.dni });
    const accesoAjeno = await request(app)
      .get(`/api/tramites/${tramiteId}`)
      .set("Authorization", `Bearer ${sesionOtroCiudadano.body.token}`);
    expect(accesoAjeno.status).toBe(403);

    const cambiarEstado = await request(app)
      .patch(`/api/tramites/${tramiteId}/estado`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ nuevoEstado: "en_revision" });
    expect(cambiarEstado.status).toBe(200);
    expect(cambiarEstado.body.estadoActual).toBe("en_revision");

    const comentarInterno = await request(app)
      .post(`/api/tramites/${tramiteId}/comentarios`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ texto: "Nota interna: derivar a mesa de entradas" });
    expect(comentarInterno.status).toBe(201);
    expect(comentarInterno.body.visibleParaVecino).toBe(false);

    const comentarVisible = await request(app)
      .post(`/api/tramites/${tramiteId}/comentarios`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ texto: "Falta un dato en la ficha médica", visibleParaVecino: true });
    expect(comentarVisible.status).toBe(201);
    expect(comentarVisible.body.visibleParaVecino).toBe(true);

    const rechazaRecursoConTipoNoPermitido = await request(app)
      .post(`/api/tramites/${tramiteId}/recursos`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombreOriginal: "virus.exe",
        claveStorage: "recursos/virus.exe",
        tipoMime: "application/x-msdownload",
        tamanioBytes: 100,
      });
    expect(rechazaRecursoConTipoNoPermitido.status).toBe(400);

    const subirRecurso = await request(app)
      .post(`/api/tramites/${tramiteId}/recursos`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nombreOriginal: "instructivo.pdf",
        claveStorage: "recursos/abc-instructivo.pdf",
        tipoMime: "application/pdf",
        tamanioBytes: 2048,
      });
    expect(subirRecurso.status).toBe(201);
    expect(subirRecurso.body.nombreOriginal).toBe("instructivo.pdf");

    const detalleParaAdmin = await request(app)
      .get(`/api/tramites/${tramiteId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(detalleParaAdmin.status).toBe(200);
    expect(detalleParaAdmin.body.tipoTramiteNombre).toBe("Inscripción a becas deportivas");
    expect(detalleParaAdmin.body.tipoTramiteVersion).toBe(1);
    expect(detalleParaAdmin.body.tipoTramiteEsquemaFormulario).toEqual(esquemaValido);
    expect(detalleParaAdmin.body.tipoTramiteFlujoEstados).toEqual(flujoValido);
    expect(detalleParaAdmin.body.comentarios).toHaveLength(2);
    expect(detalleParaAdmin.body.historial.map((e: { tipoEvento: string }) => e.tipoEvento)).toEqual([
      "creacion",
      "cambio_estado",
      "comentario",
      "comentario",
    ]);
    expect(detalleParaAdmin.body.recursos).toHaveLength(1);
    expect(detalleParaAdmin.body.recursos[0]).toMatchObject({ nombreOriginal: "instructivo.pdf" });
    expect(detalleParaAdmin.body.recursos[0].urlDescarga).toEqual(expect.any(String));

    const detalleParaVecinoConRecurso = await request(app)
      .get(`/api/tramites/${tramiteId}`)
      .set("Authorization", `Bearer ${tokenCiudadano}`);
    expect(detalleParaVecinoConRecurso.body.recursos).toHaveLength(1);
    // El vecino solo ve el comentario marcado como visible, no la nota interna.
    expect(detalleParaVecinoConRecurso.body.comentarios).toHaveLength(1);
    expect(detalleParaVecinoConRecurso.body.comentarios[0].texto).toBe("Falta un dato en la ficha médica");
    expect(
      detalleParaVecinoConRecurso.body.historial.filter((e: { tipoEvento: string }) => e.tipoEvento === "comentario"),
    ).toHaveLength(1);

    const bandeja = await request(app)
      .get("/api/admin/tramites?estado=en_revision")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(bandeja.status).toBe(200);
    expect(bandeja.body).toHaveLength(1);
    expect(bandeja.body[0].tipoTramiteNombre).toBe("Inscripción a becas deportivas");
    expect(bandeja.body[0].tipoTramiteCategoria).toBe("Deportes");
    expect(bandeja.body[0].tipoTramiteVersion).toBe(1);

    const misTramites = await request(app)
      .get("/api/tramites/mios")
      .set("Authorization", `Bearer ${tokenCiudadano}`);
    expect(misTramites.status).toBe(200);
    expect(misTramites.body[0].tipoTramiteNombre).toBe("Inscripción a becas deportivas");
    expect(misTramites.body[0].tipoTramiteVersion).toBeUndefined();

    const notificacionesVecino = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${tokenCiudadano}`);
    expect(notificacionesVecino.status).toBe(200);
    expect(notificacionesVecino.body.map((n: { mensaje: string }) => n.mensaje)).toEqual([
      expect.stringContaining("instructivo.pdf"),
      expect.stringContaining("comentario"),
      expect.stringContaining("en_revision"),
    ]);
    // Ninguna notificación corresponde al comentario interno (nota de mesa de entradas).
    expect(
      notificacionesVecino.body.some((n: { mensaje: string }) => n.mensaje.includes("mesa de entradas")),
    ).toBe(false);
    expect(notificacionesVecino.body.every((n: { leida: boolean }) => n.leida === false)).toBe(true);

    const notificacionesAdmin = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(notificacionesAdmin.status).toBe(200);
    expect(notificacionesAdmin.body).toHaveLength(1);
    expect(notificacionesAdmin.body[0].mensaje).toContain("Inscripción a becas deportivas");

    const marcarLeidas = await request(app)
      .patch("/api/notificaciones/marcar-leidas")
      .set("Authorization", `Bearer ${tokenCiudadano}`)
      .send();
    expect(marcarLeidas.status).toBe(204);

    const notificacionesVecinoLuego = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${tokenCiudadano}`);
    expect(notificacionesVecinoLuego.body.every((n: { leida: boolean }) => n.leida === true)).toBe(true);
  });
});
