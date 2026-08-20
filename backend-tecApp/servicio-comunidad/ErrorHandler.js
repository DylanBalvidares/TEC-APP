class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode || 500;
    this.message = message || "Error interno del servidor";
  }
}

// Middleware para manejar errores no capturados
function errorMiddleware(err, req, res, next) {
  console.error(`Error en Servicio Comunidad:`, err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor en Servicio Comunidad";

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
}

export default errorMiddleware;
export { ErrorHandler };
