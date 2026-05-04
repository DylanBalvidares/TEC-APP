import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";
import Alumno from "./alumnos-model.js";

const Curso = sequelize.define("cursos", {
  id_curso: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  nombre_curso: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  turno: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  aula: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
});

export default Curso;
