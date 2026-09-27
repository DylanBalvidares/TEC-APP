import express from "express";
import * as controller from "./cargos-controller.js";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const cargosRouter = express.Router();

// S1: el catálogo de cargos lo lee el administrativo; solo root lo gestiona.
const VER_CARGOS = ["administrativo_ver_cargos", "root_gestionar_cargos"];
const GESTIONAR_CARGOS = "root_gestionar_cargos";

cargosRouter.get("/cargos", comprobarPermiso(VER_CARGOS), async (req, res) => {
    
  try {
    const data = await controller.obtenerTodosCargos();
    res.status(200).json(data);
  } catch (e) {
    res.status(e.status || e.statusCode || 500).json({ error: e.message });
  }
});

cargosRouter.get("/cargos/:id", comprobarPermiso(VER_CARGOS), async (req, res) => {
    
  try {
    const data = await controller.obtenerCargo(req.params.id);
    res.status(200).json(data);
  } catch (e) {
    res.status(e.status || e.statusCode || 500).json({ error: e.message });
  }
});

cargosRouter.post("/cargos", comprobarPermiso(GESTIONAR_CARGOS), async (req, res) => {
    
  try {
    const data = await controller.crearCargo(req.body);
    res.status(201).json(data);
  } catch (e) {
    res.status(e.status || e.statusCode || 500).json({ error: e.message });
  }
});

cargosRouter.patch("/cargos/:id", comprobarPermiso(GESTIONAR_CARGOS), async (req, res) => {
    
  try {
    const data = await controller.modificarCargo({
      ...req.body,
      id_cargo: req.params.id,
    });
    res.status(200).json({ message: "Cargo actualizado correctamente" });
  } catch (e) {
    res.status(e.status || e.statusCode || 500).json({ error: e.message });
  }
});

cargosRouter.delete("/cargos/:id", comprobarPermiso(GESTIONAR_CARGOS), async (req, res) => {
    
  try {
    await controller.eliminarCargo(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(e.status || e.statusCode || 500).json({ error: e.message });
  }
});

export default cargosRouter;
