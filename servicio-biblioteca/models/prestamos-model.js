import { DataTypes } from "sequelize";
import { sequelize } from "../db/conexionDB.js";

const Prestamo = sequelize.define(
  "prestamo",
  {
    id_prestamo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_recurso: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fecha_prestamo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_devolucion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: "prestamos",
    timestamps: false,
  },
);

export default Prestamo;
