import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Biblioteca = sequelize.define(
  "biblioteca",
  {
    id_biblioteca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ubicacion: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    responsable: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "biblioteca",
    timestamps: false,
  }
);

export default Biblioteca;
