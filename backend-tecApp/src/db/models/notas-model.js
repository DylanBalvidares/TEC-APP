import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Nota = sequelize.define("notas", {
  id_nota: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  id_alumno: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "alumnos",
      key: "id_alumno",
    },
  },
  id_asignacion: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "asignaciones",
      key: "id_asignacion",
    },
  },
  calificacion: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
    validate: {
      min: 0.0,
      max: 10.0,
    },
  },
  fecha_carga: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Nota;
