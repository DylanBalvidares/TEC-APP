import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Sancion = sequelize.define(
  "sanciones",
  {
    id_sancion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_alumno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("apercibimiento", "suspension", "amonestacion"),
      allowNull: false,
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    registrado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "sanciones",
    timestamps: false,
  },
);

export default Sancion;
