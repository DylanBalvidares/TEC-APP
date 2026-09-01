import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "e40bfee55a03ffe69a2a3ecb930df395"
    );
    req.user = payload;
    req.headers["id_usuario"] = payload.id || payload.id_usuario;
    req.headers["email"] = payload.email;
    req.headers["id_rol"] = payload.id_rol || payload.rol;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
}

export default autenticar;
