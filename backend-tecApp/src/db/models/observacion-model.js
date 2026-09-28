import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Observacion = sequelize.define(
  "observaciones",
  {
    id_observacion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_alumno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    registrado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "observaciones",
    timestamps: false,
  },
);

export default Observacion;
