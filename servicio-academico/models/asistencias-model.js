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
    type: DataTypes.DATE,
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

Asistencia.hasOne(Alumno, {
  foreignKey: "id_alumno",
});
export default Asistencia;
