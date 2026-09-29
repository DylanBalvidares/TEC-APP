import { Router } from "express";
import comprobarPermiso, { soloAutenticado } from "../../middlewares/comprobarPermisos.js";
import { suscribir } from "../../utils/eventos.js";

const eventosRouter = Router();

// Canal SSE de eventos (colas y edición concurrente). Latido cada 25 s
// para mantener viva la conexión detrás de proxies.
eventosRouter.get(
  "/eventos",
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
