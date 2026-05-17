import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";
import Alumno from "./alumnos-model.js";

const Asistencia = sequelize.define(
  "asistencias",
  {
    id_asistencia: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    fecha: {
      type: DataTypes.DATEONLY, //DATEONLY->ej:"2026-05-04"
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("presente", "ausente", "justificado", "tardanza"),
      allowNull: false,
    },

    //FK
    id_alumno: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "alumnos",
        key: "id_alumno",
      },
    },

    //FK
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cursos",
        key: "id_curso",
      },
    },
  },
  {
    indexes: [
      {
        name: "uq_asis_dia",
        unique: true,
        fields: ["id_alumno", "fecha"], // Aquí implementas la UNIQUE KEY compuesta
      },
      {
        name: "id_alumno_idx",
        fields: ["id_alumno"],
      },
      {
        name: "id_curso_idx",
        fields: ["id_curso"],
      },
    ],
  },
);

export default Asistencia;
