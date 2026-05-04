import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";
import Alumno from "./alumnos-model.js";

const Asistencia = sequelize.define("asistencias", {
  id_asistencia: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  fecha: {
    type: DataTypes.DATEONLY,//DATEONLY->ej:"2026-05-04"
    allowNull: false,
  },

  estado: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  id_alumno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Alumno",
      key: "id_alumno",
    },
  },
});

export default Asistencia;
