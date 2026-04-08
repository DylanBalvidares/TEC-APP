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
    const id = req.params.id;

    try {
        const curso = await obtenerCurso(id);

        return res.json(curso).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(404);
    }
});

cursosRouter.get("/cursos", async (req, res) => {
    try {
        const cursos = await obtenerTodosCursos();
        return res.json(cursos).statusCode(200);

    } catch (error) {
        return res.json(error).statusCode(201); //400?
    }
});

cursosRouter.post("/cursos/:curso", async (req, res) => {
    console.log("== CURSO REQUEST:", req.body); //DEBUG
    try {
        const curso = await crearCurso(req.body);
        return res.json(req.body).statusCode(201);
    } catch (error) {
        return res.json(error).statusCode(400); //400?
    }
});

cursosRouter.delete("/cursos/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const resultado = await eliminarCurso(id);
        return res.json(resultado).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(400); //400?
    }
});

cursosRouter.patch("/cursos/:curso", async (req, res) => {
    const { id, nombre, turno, aula } = req.body;
    try {
        const curso = {
            id: id,
            nombre: nombre,
            turno: turno,
            aula: aula,
        };

        const resultado = await modificarCurso(curso);
        return res.json(resultado).statusCode(200);//200->>OK,put/patch
    } catch (error) {
        return res.json(error).statusCode(400);//400?
    }
});

export default cursosRouter;