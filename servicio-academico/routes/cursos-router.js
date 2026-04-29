import { Router } from 'express';
import {
    crearCurso,
    obtenerCurso,
    obtenerTodosCursos,
    eliminarCurso,
    modificarCurso,
} from "../controllers/cursos-controller.js"

const cursosRouter = Router();

cursosRouter.get("/cursos/:id", async (req, res) => {

    try {
        const curso = await obtenerCurso(req.params.id);

        return res.status(200).json(curso);
    } catch (error) {
        return res.status(404).body(error);
    }
});

cursosRouter.get("/cursos", async (req, res) => {
    try {
        const cursos = await obtenerTodosCursos();
        return res.status(200).json(cursos);
    } catch (error) {
        return res.status(404).json(error);
    }
});

cursosRouter.post("/cursos/:curso", async (req, res) => {
    console.log("== CURSO REQUEST:", req.body); //DEBUG
    try {
        const curso = await crearCurso(req.body);
        return res.status(201).json(req.body);
    } catch (error) {
        return res.status(404).json(error);
    }
});

cursosRouter.delete("/cursos/:id", async (req, res) => {
    try {
        const resultado = await eliminarCurso(req.params.id);
        return res.status(201).json(resultado);
    } catch (error) {
        return res.status(404).json(error);
    }
});

cursosRouter.patch("/cursos/:curso", async (req, res) => {
    const { id, nombre, turno, aula } = req.body;
    try {
        const curso = {
            nombre: nombre,
            turno: turno,
            aula: aula,
        };

        const resultado = await modificarCurso(curso);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(400).body(error);
    }
});

export default cursosRouter;