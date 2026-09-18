// Secret único para firmar/verificar JWT.
// Obligatorio en producción; en dev usa uno explícito para no dejar secretos en el repo.
export default function obtenerJWTSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET es obligatorio en producción. Definilo en el entorno.",
    );
  }

  return "dev-jwt-secret-no-usar-en-produccion";
}