import { Router } from 'express'

import {
    obtenerTodosProfesores,
    obtenerProfesor,
    eliminarProfesor,
    modificarProfesor,
    crearProfesor,
} from "../controllers/profesores-controller.js"

const profesoresRouter = Router();


profesoresRouter.get("/profesores/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const profesor = await obtenerProfesor(id);

        return res.json(profesor).statusCode(200);
    } catch (error) {
        return res.json(profesor).statusCode(404);
    }
});

profesoresRouter.get("/profesores", async (req, res) => {
    try {
        const profesores = await obtenerTodosProfesores();
        return res.json(profesores).statusCode(200);

    } catch (error) {
        return res.json(profesores).statusCode(201); //400?
    }
});

profesoresRouter.post("/profesores/:profesor", async (req, res) => {
    console.log("== PROFESOR REQUEST:", req.body); //DEBUG
    try {
        const curso = await crearProfesor(req.body);
        return res.json(req.body).statusCode(201);
    } catch (error) {
        return res.json(error).statusCode(400); //400?
    }
});

profesoresRouter.delete("/profesores/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const resultado = await eliminarProfesor(id);
        return res.json(resultado).statusCode(200);
    } catch (error) {
        return res.json(error).statusCode(400); //400?
    }
});

profesoresRouter.patch("/profesores/:profesor", async (req, res) => {
    const { id, nombre, apellido, materia, email } = req.body;
    try {
        const profesor = {
            id: id,
            nombre: nombre,
            apellido: nombre,
            materia: materia,
            email: email,
        };

        const resultado = await modificarProfesor(profesor);
        return res.json(resultado).statusCode(200);//200->>OK,put/patch
    } catch (error) {
        return res.json(error).statusCode(400);//400?
    }
});

export default profesoresRouter;