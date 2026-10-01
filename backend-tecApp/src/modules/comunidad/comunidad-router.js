import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as noticiasCtrl from "./noticias-controller.js";
import * as comunicadosCtrl from "./comunicados-controller.js";
import * as objetosCtrl from "./objetos-perdidos-controller.js";
import * as mensajesCtrl from "./mensajes-controller.js";
import upload from "../../middlewares/uploads.js";
import autenticar from "../../middlewares/autenticar.js";
import comprobarPermisos, {
  soloAutenticado,
} from "../../middlewares/comprobarPermisos.js";
import { obtenerHistorialGlobal, marcarCorreoLeido } from "./comunidad-service.js";

const router = Router();

// S5: cualquier usuario autenticado lee noticias, comunicados y objetos, pero
// la intención queda explícita para el guardrail (soloAutenticado).
const LECTURA_COMUNIDAD = comprobarPermisos(soloAutenticado);

// S5: el filtro `rol` de comunicados sale del token, no del query. Un alumno
// no puede pedir `?rol=root` para leer comunicados de autoridades. `curso` y
// `cursos` sí pueden venir del query porque sólo refinan dentro del destino
// permitido para ese rol.
const DESTINOS_POR_ROL = {
  1: "alumno",
  2: "alumno",
  3: "profesor",
  4: "autoridades",
  5: "autoridades",
  6: "alumno",
  7: "administrador",
  8: "root",
};

function rolParaComunicados(req) {
  return DESTINOS_POR_ROL[Number(req.headers["id_rol"])] || "alumno";
}

// S6: autoría para editar/eliminar noticias. Root pasa por permiso
// (root_eliminar_cualquier_contenido); el resto sólo si es el autor.
function contextoAutoria(req) {
  return {
    idUsuario: Number(req.headers["id_usuario"]),
    esRoot: Number(req.headers["id_rol"]) === 8,
  };
}

// === Middleware de autenticación para TODAS las rutas ===
router.use(autenticar);

// === RUTAS DE NOTICIAS ===
router.get("/noticias", LECTURA_COMUNIDAD, async (req, res) => {
  try {
    const noticias = await noticiasCtrl.obtenerTodasNoticias();
    return res.status(200).json(noticias);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get("/noticias/:id", LECTURA_COMUNIDAD, async (req, res) => {
  try {
    const noticia = await noticiasCtrl.obtenerNoticia(req.params.id);
    return res.status(200).json(noticia);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post("/noticias", comprobarPermisos(["delegado_crear_noticia"]), upload.single("imagen"), async (req, res) => {
  try {
    const noticia = await noticiasCtrl.crearNoticia(
      req.body,
      req.file,
      Number(req.headers["id_usuario"]),
    );
    return res.status(201).json(noticia);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.patch("/noticias/:id", comprobarPermisos(["delegado_editar_mis_noticias", "root_eliminar_cualquier_contenido"]), upload.single("imagen"), async (req, res) => {
  try {
    const resultado = await noticiasCtrl.actualizarNoticia(
      req.params.id,
      { ...req.body, imagen: req.file?.filename },
      contextoAutoria(req),
    );
    return res.status(200).json({ mensaje: "Noticia actualizada", resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete("/noticias/:id", comprobarPermisos(["delegado_eliminar_mis_noticias", "root_eliminar_cualquier_contenido"]), async (req, res) => {
  try {
    const resultado = await noticiasCtrl.eliminarNoticia(
      req.params.id,
      contextoAutoria(req),
    );
    return res.status(200).json({ mensaje: "Noticia eliminada", resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// === RUTAS DE COMUNICADOS ===
router.get("/comunicados", LECTURA_COMUNIDAD, async (req, res) => {
  try {
    const comunicados = await comunicadosCtrl.obtenerTodosComunicados({
      ...req.query,
      rol: rolParaComunicados(req),
      // Identidad desde el token, nunca desde el query: un profesor no puede
      // pedir los comunicados de otro autor con ?autor_id=.
      autor_id: Number(req.headers["id_usuario"]),
    });
    return res.status(200).json(comunicados);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get("/comunicados/:id", LECTURA_COMUNIDAD, async (req, res) => {
  try {
    const comunicado = await comunicadosCtrl.obtenerComunicado(req.params.id);
    return res.status(200).json(comunicado);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post("/comunicados", comprobarPermisos("comunicado_crear"), async (req, res) => {
  try {
    const comunicado = await comunicadosCtrl.crearComunicado(req.body);
    return res.status(201).json(comunicado);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put("/comunicados/:id", comprobarPermisos("comunicado_editar"), async (req, res) => {
  try {
    const resultado = await comunicadosCtrl.actualizarComunicado(
      req.params.id,
      req.body,
    );
    return res
      .status(200)
      .json({ mensaje: "Comunicado actualizado", resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete("/comunicados/:id", comprobarPermisos("comunicado_eliminar"), async (req, res) => {
  try {
    const resultado = await comunicadosCtrl.eliminarComunicado(req.params.id);
    return res.status(200).json({ mensaje: "Comunicado eliminado", resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// === RUTAS DE OBJETOS PERDIDOS ===
router.get("/objetos-perdidos", LECTURA_COMUNIDAD, async (req, res) => {
  try {
    const objetos = await objetosCtrl.obtenerTodosObjetos();
    return res.status(200).json(objetos);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get("/objetos-perdidos/:id", LECTURA_COMUNIDAD, async (req, res) => {
  try {
    const objeto = await objetosCtrl.obtenerObjeto(req.params.id);
    return res.status(200).json(objeto);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Reportar un objeto perdido: abierto a cualquier usuario autenticado (feature
// pensada para alumnos), pero SIEMPRE explícito para no dejar la ruta abierta.
router.post("/objetos-perdidos", comprobarPermisos(soloAutenticado), async (req, res) => {
  try {
    const objeto = await objetosCtrl.reportarObjeto(req.body);
    return res.status(201).json(objeto);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Gestionar (marcar devuelto / editar) un objeto perdido: sólo staff.
// Nota: no existe un permiso dedicado todavía; se usa el marcador
// administrativo + root (que en el seed tiene todos los permisos).
router.put(
  "/objetos-perdidos/:id",
  comprobarPermisos([
    "administrativo_ver_reportes",
    "root_eliminar_cualquier_contenido",
  ]),
  async (req, res) => {
  try {
    const resultado = await objetosCtrl.actualizarEstadoObjeto(
      req.params.id,
      req.body.estado,
    );
    return res.status(200).json({ mensaje: "Estado actualizado", resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Eliminar un objeto perdido: sólo staff (mismo criterio que el PUT).
router.delete(
  "/objetos-perdidos/:id",
  comprobarPermisos([
    "administrativo_ver_reportes",
    "root_eliminar_cualquier_contenido",
  ]),
  async (req, res) => {
  try {
    const resultado = await objetosCtrl.eliminarObjeto(req.params.id);
    return res.status(200).json({ mensaje: "Objeto eliminado", resultado });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});


// === RUTAS DE MONITOREO DE EMAILS ===
// SEGURIDAD (ALTO-2): el historial global de emails contiene datos de toda la
// institución; antes lo podía leer cualquier usuario autenticado.
const PERMISOS_MONITOREO = [
  "root_ver_logs_sistema",
  "administrativo_ver_reportes",
];

router.get("/monitoreo", comprobarPermisos(PERMISOS_MONITOREO), async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta, limit = 50 } = req.query;
    const result = await obtenerHistorialGlobal({
      estado: estado || undefined,
      fecha_desde: fecha_desde || undefined,
      fecha_hasta: fecha_hasta || undefined,
      limit: parseInt(limit) || 50,
    });
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ mensaje: result.mensaje });
    }
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
});

router.post("/marcar-leido", comprobarPermisos(PERMISOS_MONITOREO), async (req, res) => {
  try {
    const { id_correo } = req.body;
    const result = await marcarCorreoLeido(id_correo);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ mensaje: error.message });
  }
});

// === RUTAS DE MENSAJES WHATSAPP ===
// Profesor/preceptor: solo su historial propio + envío a su ámbito.
// Admin (root): control total vía whatsapp_ver_todos / whatsapp_gestionar.
const limitadorWhatsapp = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Demasiados WhatsApp. Esperá unos minutos e intentá de nuevo." },
});

router.post("/mensajes/validar", comprobarPermisos("whatsapp_enviar"), async (req, res) => {
  try {
    const { diagnosticarTelefono } = await import("../../utils/whatsappProvider.js");
    const r = diagnosticarTelefono(req.body?.telefono);
    return res.status(200).json({ ok: true, ...r });
  } catch (error) {
    return res
      .status(error.status || error.statusCode || 500)
      .json({ ok: false, error: error.message });
  }
});

router.post(
  "/mensajes/enviar-alumno/:id_alumno",
  limitadorWhatsapp,
  comprobarPermisos("whatsapp_enviar"),
  async (req, res) => {
    try {
      const data = await mensajesCtrl.enviarWhatsappAAlumno(
        req.params.id_alumno,
        req.body?.cuerpo ?? req.body?.mensaje,
        req.headers["id_usuario"],
        req.headers["id_rol"],
      );
      return res.status(201).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

router.get(
  "/mensajes/diagnostico-telefonos",
  comprobarPermisos(["whatsapp_ver_todos", "root_ver_logs_sistema", "administrativo_ver_reportes"]),
  async (req, res) => {
    try {
      const data = await mensajesCtrl.diagnosticarTelefonos();
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

router.get("/mensajes/mios", comprobarPermisos("whatsapp_ver_propio"), async (req, res) => {
  try {
    const data = await mensajesCtrl.listarMisMensajes(req.headers["id_usuario"], req.query);
    return res.status(200).json({ ok: true, ...data });
  } catch (error) {
    return res
      .status(error.status || error.statusCode || 500)
      .json({ ok: false, error: error.message });
  }
});

router.get(
  "/mensajes/todos",
  comprobarPermisos(["whatsapp_ver_todos", "root_ver_logs_sistema", "administrativo_ver_reportes"]),
  async (req, res) => {
    try {
      const data = await mensajesCtrl.listarTodosMensajes(req.query);
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

router.post(
  "/mensajes/:id/reenviar",
  comprobarPermisos("whatsapp_gestionar"),
  async (req, res) => {
    try {
      const data = await mensajesCtrl.reenviarMensaje(req.params.id, req.headers["id_usuario"]);
      return res.status(201).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

router.patch(
  "/mensajes/:id/leido",
  comprobarPermisos(["whatsapp_gestionar", "whatsapp_ver_todos", "whatsapp_ver_propio"]),
  async (req, res) => {
    try {
      const data = await mensajesCtrl.marcarMensajeLeido(req.params.id);
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

router.delete("/mensajes/:id", comprobarPermisos("whatsapp_gestionar"), async (req, res) => {
  try {
    const data = await mensajesCtrl.eliminarMensaje(req.params.id);
    return res.status(200).json({ ok: true, ...data });
  } catch (error) {
    return res
      .status(error.status || error.statusCode || 500)
      .json({ ok: false, error: error.message });
  }
});

export default router;
