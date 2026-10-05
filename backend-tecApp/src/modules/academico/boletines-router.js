import { Router } from "express";
import {
  listarPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  prepararCurso,
  obtenerCargaProfesor,
  guardarCalificacion,
  finalizarMateria,
  obtenerPlanilla,
  obtenerConsolidado,
  solicitarReapertura,
  decidirReapertura,
  listarReaperturas,
  obtenerHistorialBoletin,
} from "./boletines-controller.js";

import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const boletinesRouter = Router();

// 1. Períodos: lectura general
boletinesRouter.get(
  "/boletines/periodos",
  comprobarPermiso("boletin_ver_periodos"),
  async (req, res) => {
    try {
      const periodos = await listarPeriodos();
      return res.status(200).json(periodos);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 2. Períodos: crear (administración)
boletinesRouter.post(
  "/boletines/periodos",
  comprobarPermiso("boletin_gestionar_periodos"),
  async (req, res) => {
    try {
      const periodo = await crearPeriodo(req.body);
      return res.status(201).json(periodo);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 3. Períodos: fechas y estado (administración)
boletinesRouter.patch(
  "/boletines/periodos/:id",
  comprobarPermiso("boletin_gestionar_periodos"),
  async (req, res) => {
    try {
      const periodo = await actualizarPeriodo(req.params.id, req.body);
      return res.status(200).json(periodo);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 4. Preparar curso: fija snapshot de materias (administración)
boletinesRouter.post(
  "/boletines/periodos/:id/preparar",
  comprobarPermiso("boletin_gestionar_periodos"),
  async (req, res) => {
    try {
      const resumen = await prepararCurso(req.params.id, req.body.id_curso, req.body.id_plan);
      return res.status(200).json(resumen);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 5. Carga del profesor autenticado
boletinesRouter.get(
  "/boletines/profesor",
  comprobarPermiso("boletin_cargar"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const data = await obtenerCargaProfesor(idUsuario, req.query.id_periodo);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 6. Guardar calificación final (profesor)
boletinesRouter.post(
  "/boletines/calificaciones",
  comprobarPermiso("boletin_cargar"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const fila = await guardarCalificacion(req.body, idUsuario, idRol);
      return res.status(201).json(fila);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 7. Finalizar materia (profesor)
boletinesRouter.post(
  "/boletines/finalizar",
  comprobarPermiso("boletin_finalizar"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const finalizacion = await finalizarMateria(req.body, idUsuario, idRol);
      return res.status(200).json(finalizacion);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 8. Planilla por materia finalizada (preceptor / supervisión)
boletinesRouter.get(
  "/boletines/planilla/curso/:id_curso",
  comprobarPermiso("boletin_ver_planilla"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const data = await obtenerPlanilla(
        req.params.id_curso,
        idUsuario,
        idRol,
        req.query.id_periodo,
      );
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 9. Consolidado del curso (solo si todo está finalizado)
boletinesRouter.get(
  "/boletines/consolidado/curso/:id_curso",
  comprobarPermiso("boletin_ver_consolidado"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const data = await obtenerConsolidado(
        req.params.id_curso,
        idUsuario,
        idRol,
        req.query.id_periodo,
      );
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 10. Reaperturas: listar (admin ve todo, profesor solo las suyas)
boletinesRouter.get(
  "/boletines/reaperturas",
  comprobarPermiso(["boletin_decidir_reapertura", "boletin_solicitar_reapertura"]),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const lista = await listarReaperturas(idUsuario, idRol, req.query);
      return res.status(200).json(lista);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 11. Reaperturas: solicitar (profesor)
boletinesRouter.post(
  "/boletines/reaperturas",
  comprobarPermiso("boletin_solicitar_reapertura"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const solicitud = await solicitarReapertura(req.body, idUsuario, idRol);
      return res.status(201).json(solicitud);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 12. Reaperturas: decidir (administración)
boletinesRouter.patch(
  "/boletines/reaperturas/:id",
  comprobarPermiso("boletin_decidir_reapertura"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const solicitud = await decidirReapertura(req.params.id, req.body, idUsuario);
      return res.status(200).json(solicitud);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

// 13. Historial de boletín por alumno
boletinesRouter.get(
  "/boletines/historial/alumno/:id_alumno",
  comprobarPermiso("boletin_ver_historial"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const historial = await obtenerHistorialBoletin(
        req.params.id_alumno,
        idUsuario,
        idRol,
        req.query.id_periodo,
      );
      return res.status(200).json(historial);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

export default boletinesRouter;
