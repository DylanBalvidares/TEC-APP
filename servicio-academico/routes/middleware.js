function middleware(error, req, res, next) {
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      error: "El recurso ya existe",
    });
  }
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: error.errors.map((e) => e.message),
    });
  }

  console.error(error);
  res.status(500).json({
    error: "Error interno del servidor",
  });
}

export default middleware;
