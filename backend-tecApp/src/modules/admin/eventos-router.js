import { Router } from "express";
import comprobarPermiso, { soloAutenticado } from "../../middlewares/comprobarPermisos.js";
import { suscribir } from "../../utils/eventos.js";

const eventosRouter = Router();

// EventSource no puede enviar headers: se acepta el JWT por query (?token=)
// solo en este endpoint SSE y se promueve a Authorization antes de autenticar.
function tokenPorQuery(req, res, next) {
  if (!req.headers?.authorization && typeof req.query?.token === "string" && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

// Canal SSE de eventos (colas y edición concurrente). Latido cada 25 s
// para mantener viva la conexión detrás de proxies.
eventosRouter.get(
  "/eventos",
  tokenPorQuery,
  comprobarPermiso(soloAutenticado),
  async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const enviar = (evento) => {
      res.write(`event: ${evento.tipo}\n`);
      res.write(`data: ${JSON.stringify(evento)}\n\n`);
    };
    enviar({ tipo: "conectado", datos: {}, fecha: new Date().toISOString() });

    const desuscribir = suscribir({ write: enviar, end: () => {} });
    const latido = setInterval(() => res.write(": latido\n\n"), 25000);

    req.on("close", () => {
      clearInterval(latido);
      desuscribir();
    });
  },
);

export default eventosRouter;
