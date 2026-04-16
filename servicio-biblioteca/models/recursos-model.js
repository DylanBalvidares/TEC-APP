import { DataTypes } from "sequelize";
import { sequelize } from "../db/conexionDB.js";

const Recurso = sequelize.define(
  "recurso",
  {
    id_recurso: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    id_biblioteca: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "recursos",
    timestamps: false,
  },
);

export default Recurso;
