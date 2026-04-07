import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";
import Curso from "./cursos-model.js";

const Alumno = sequelize.define("alumnos", {
  id_alumno: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  //FOREIGN KEY
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "cursos",
      key: "id_curso",
    },
  },
});

Alumno.hasOne(Curso, {
  foreignKey: "id_curso",
});

export default Alumno;
