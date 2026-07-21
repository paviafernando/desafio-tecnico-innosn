/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/src/**/*.test.ts"],
  clearMocks: true,
  // Los tests de src/repositories/*.test.ts son de integración contra el
  // mismo PostgreSQL real (docker-compose): correrlos en paralelo dispara
  // condiciones de carrera entre archivos (TRUNCATE de uno pisando el
  // fixture de otro). Se corren en serie; el costo es despreciable dado el
  // tamaño actual de la suite.
  maxWorkers: 1,
};
