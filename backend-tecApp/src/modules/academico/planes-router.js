import { Router } from "express";
import {
  crearPlan,
  obtenerPlan,
  obtenerTodosPlanes,
  obtenerVigentes,
  eliminarPlan,
  modificarPlan,
  agregarMateriaAPlan,
  quitarMateriaDePlan,
  agregarCorrelativa,
  quitarCorrelativa,
} from "./planes-controller.js";

import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const planesRouter = Router();

const PERMISO_VER = [
  "administrativo_ver_planes",
  "profesor_ver_planes",
  "preceptor_ver_planes",
];

// Vigentes ANTES de /:id para que "vigentes" no se interprete como id.
planesRouter.get("/planes/vigentes", comprobarPermiso(PERMISO_VER), async (req, res) => {
  try {
    const planes = await obtenerVigentes({
      anio: req.query.anio,
      curso: req.query.curso,
    });
    return res.status(200).json(planes);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

planesRouter.get("/planes/:id", comprobarPermiso(PERMISO_VER), async (req, res) => {
  try {
    const plan = await obtenerPlan(req.params.id);
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

planesRouter.get("/planes", comprobarPermiso(PERMISO_VER), async (req, res) => {
  try {
    const planes = await obtenerTodosPlanes();
    return res.status(200).json(planes);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

planesRouter.post("/planes", comprobarPermiso("administrativo_crear_plan"), async (req, res) => {
  try {
    const plan = await crearPlan(req.body);
    return res.status(201).json(plan);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

planesRouter.delete(
  "/planes/:id",
  comprobarPermiso("administrativo_eliminar_plan"),
  async (req, res) => {
    try {
      const resultado = await eliminarPlan(req.params.id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

planesRouter.patch("/planes", comprobarPermiso("administrativo_editar_plan"), async (req, res) => {
  try {
    const plan = await modificarPlan(req.body);
    return res.status(200).json(plan);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

planesRouter.post(
  "/planes/:id/materias",
  comprobarPermiso("administrativo_editar_plan"),
  async (req, res) => {
    try {
      const vinculo = await agregarMateriaAPlan(req.params.id, req.body);
      return res.status(201).json(vinculo);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

planesRouter.delete(
  "/planes/materias/:id",
  comprobarPermiso("administrativo_editar_plan"),
  async (req, res) => {
    try {
      const resultado = await quitarMateriaDePlan(req.params.id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

planesRouter.post(
  "/planes/materias/:id/correlativas",
  comprobarPermiso("administrativo_editar_plan"),
  async (req, res) => {
    try {
      const correlativa = await agregarCorrelativa(req.params.id, req.body);
      return res.status(201).json(correlativa);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

planesRouter.delete(
  "/planes/materias/:id/correlativas/:idReq",
  comprobarPermiso("administrativo_editar_plan"),
  async (req, res) => {
    try {
      const resultado = await quitarCorrelativa(req.params.id, req.params.idReq);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

export default planesRouter;
