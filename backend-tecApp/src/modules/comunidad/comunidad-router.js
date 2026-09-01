import { Router } from "express";
import * as noticiasCtrl from "./noticias-controller.js";
import * as comunicadosCtrl from "./comunicados-controller.js";
import * as objetosCtrl from "./objetos-perdidos-controller.js";
import upload from "../../middlewares/uploads.js";
import autenticar from "../../middlewares/autenticar.js";
import comprobarPermisos from "../../middlewares/comprobarPermisos.js";

const router = Router();

// === Middleware de autenticación para TODAS las rutas ===
router.use(autenticar);

// === RUTAS DE NOTICIAS ===
router.get("/noticias", async (req, res) => {
  try {
    const noticias = await noticiasCtrl.obtenerTodasNoticias();
    return res.status(200).json(noticias);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.get("/noticias/:id", async (req, res) => {
  try {
    const noticia = await noticiasCtrl.obtenerNoticia(req.params.id);
    return res.status(200).json(noticia);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.post("/noticias", comprobarPermisos(), upload.single("imagen"), async (req, res) => {
  console.log("=== Datos recibidos en POST /noticias ===");
  console.log(req.body);
  console.log(req.file);
  console.log("==========================================");
  try {
    const noticia = await noticiasCtrl.crearNoticia(req.body, req.file);
    return res.status(201).json(noticia);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.patch("/noticias/:id", comprobarPermisos(), upload.single("imagen"), async (req, res) => {
  try {
    const resultado = await noticiasCtrl.actualizarNoticia(
      req.params.id,
      req.body,
      req.file,
    );
    return res.status(200).json({ mensaje: "Noticia actualizada", resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.delete("/noticias/:id", comprobarPermisos(), async (req, res) => {
  try {
    const resultado = await noticiasCtrl.eliminarNoticia(req.params.id);
    return res.status(200).json({ mensaje: "Noticia eliminada", resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// === RUTAS DE COMUNICADOS ===
router.get("/comunicados", async (req, res) => {
  try {
    const comunicados = await comunicadosCtrl.obtenerTodosComunicados(req.query);
    return res.status(200).json(comunicados);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.get("/comunicados/:id", async (req, res) => {
  try {
    const comunicado = await comunicadosCtrl.obtenerComunicado(req.params.id);
    return res.status(200).json(comunicado);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.post("/comunicados", comprobarPermisos(), async (req, res) => {
  try {
    const comunicado = await comunicadosCtrl.crearComunicado(req.body);
    return res.status(201).json(comunicado);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.put("/comunicados/:id", comprobarPermisos(), async (req, res) => {
  try {
    const resultado = await comunicadosCtrl.actualizarComunicado(
      req.params.id,
      req.body,
    );
    return res
      .status(200)
      .json({ mensaje: "Comunicado actualizado", resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.delete("/comunicados/:id", comprobarPermisos(), async (req, res) => {
  try {
    const resultado = await comunicadosCtrl.eliminarComunicado(req.params.id);
    return res.status(200).json({ mensaje: "Comunicado eliminado", resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// === RUTAS DE OBJETOS PERDIDOS ===
router.get("/objetos-perdidos", async (req, res) => {
  try {
    const objetos = await objetosCtrl.obtenerTodosObjetos();
    return res.status(200).json(objetos);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.get("/objetos-perdidos/:id", async (req, res) => {
  try {
    const objeto = await objetosCtrl.obtenerObjeto(req.params.id);
    return res.status(200).json(objeto);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.post("/objetos-perdidos", comprobarPermisos(), async (req, res) => {
  try {
    const objeto = await objetosCtrl.reportarObjeto(req.body);
    return res.status(201).json(objeto);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.put("/objetos-perdidos/:id", comprobarPermisos(), async (req, res) => {
  try {
    const resultado = await objetosCtrl.actualizarEstadoObjeto(
      req.params.id,
      req.body.estado,
    );
    return res.status(200).json({ mensaje: "Estado actualizado", resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.delete("/objetos-perdidos/:id", comprobarPermisos(), async (req, res) => {
  try {
    const resultado = await objetosCtrl.eliminarObjeto(req.params.id);
    return res.status(200).json({ mensaje: "Objeto eliminado", resultado });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

export default router;
