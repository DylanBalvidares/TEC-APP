// Secret único para firmar/verificar JWT.
// Obligatorio fuera de desarrollo: si NODE_ENV es "production" (y también
// cualquier entorno que no sea explícitamente de desarrollo/test) el arranque
// falla si falta JWT_SECRET, para no firmar tokens con un secreto conocido.
let avisoEmitido = false;

export default function obtenerJWTSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  const entorno = process.env.NODE_ENV;

  if (entorno !== "development" && entorno !== "test") {
    throw new Error(
      "JWT_SECRET es obligatorio. Definilo en el entorno (NODE_ENV=production no admite el valor de desarrollo).",
    );
  }

  if (!avisoEmitido) {
    avisoEmitido = true;
    console.warn(
      "\x1b[1m\x1b[33m[WARN]\x1b[0m JWT_SECRET no definido: se usa un secreto de DESARROLLO. No lo uses en producción.",
    );
  }

  return "dev-jwt-secret-no-usar-en-produccion";
}
