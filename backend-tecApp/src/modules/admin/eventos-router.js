import { Router } from "express";
import comprobarPermiso, { soloAutenticado } from "../../middlewares/comprobarPermisos.js";
import { suscribir } from "../../utils/eventos.js";

const eventosRouter = Router();

// EventSource no puede enviar headers: el JWT viaja por query (?token=) y el
// middleware `autenticar` lo acepta SOLO cuando la URL es /api/admin/eventos.

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

    // Se registra la identidad del token: los eventos dirigidos
    // (ej. notificaciones) llegan solo a su dueño.
    const desuscribir = suscribir(
      { write: enviar, end: () => {} },
      { id_usuario: req.headers["id_usuario"] ?? null },
    );
    const latido = setInterval(() => res.write(": latido\n\n"), 25000);

    req.on("close", () => {
      clearInterval(latido);
      desuscribir();
    });
  },
);

export default eventosRouter;
