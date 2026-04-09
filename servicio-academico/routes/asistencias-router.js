<<<<<<< HEAD
import { Router } from 'express'
import {
    obtenerAsistencia,
    crearAsistencia,
    eliminarAsistencia,
    modificarAsistencia,
    obtenerTodosAsistencias,
} from '../controllers/asistencias-controller.js'

const asistenciasRouter = Router();

asistenciasRouter.get("/asistencias/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const asistencia = obtenerAsistencia(id);

        return res.json(asistencia).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(404);
    }
});

asistenciasRouter.get("/asistencias", async (req, res) => {
    try {
        const asistencias = await obtenerTodosAsistencias();
        return res.json(asistencias).statusCode(200);

    } catch (error) {
        return res.json(error).statusCode(201);
    }
});

asistenciasRouter.post("/asistencias/:asistencia", async (req, res) => {
    try {
        const asistencia = await crearAsistencia(req.body);
        return res.json(req.body).status(200);
    } catch (error) {
        return res.json(error).statusCode(400);
    }
});

asistenciasRouter.delete("/asistencias/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const resultado = await eliminarAsistencia(id);
        return res.json(resultado).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(400);
    }
});

asistenciasRouter.patch("/asistencias/:asistencia", async (req, res) => {
    const { id_asistencia, fecha, estado, id_alumno } = req.body;
    try {
        const asistencia = {
            fecha: fecha,
            estado: estado,
            id_alumno: id_alumno,
        };

        const resultado = await modificarAsistencia(asistencia);
        return res.json(resultado).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(400);
    }
});

=======
import { Router } from 'express'
import {
    obtenerAsistencia,
    crearAsistencia,
    eliminarAsistencia,
    modificarAsistencia,
    obtenerTodosAsistencias,
} from '../controllers/asistencias-controller.js'

const asistenciasRouter = Router();

asistenciasRouter.get("/asistencias/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const asistencia = obtenerAsistencia(id);

        return res.json(asistencia).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(404);
    }
});

asistenciasRouter.get("/asistencias", async (req, res) => {
    try {
        const asistencias = await obtenerTodosAsistencias();
        return res.json(asistencias).statusCode(200);

    } catch (error) {
        return res.json(error).statusCode(201);
    }
});

asistenciasRouter.post("/asistencias/:asistencia", async (req, res) => {
    try {
        const asistencia = await crearAsistencia(req.body);
        return res.json(req.body).status(200);
    } catch (error) {
        return res.json(error).statusCode(400);
    }
});

asistenciasRouter.delete("/asistencias/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const resultado = await eliminarAsistencia(id);
        return res.json(resultado).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(400);
    }
});

asistenciasRouter.patch("/asistencias/:asistencia", async (req, res) => {
    const { id_asistencia, fecha, estado, id_alumno } = req.body;
    try {
        const asistencia = {
            fecha: fecha,
            estado: estado,
            id_alumno: id_alumno,
        };

        const resultado = await modificarAsistencia(asistencia);
        return res.json(resultado).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(400);
    }
});

>>>>>>> edbad23 (asistencias & cursos fixes)
export default asistenciasRouter;