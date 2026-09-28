import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Auditoria = sequelize.define(
  "auditoria",
  {
    id_auditoria: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    accion: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    entidad: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    id_entidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    datos_antes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    datos_despues: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "auditoria",
    timestamps: false,
  },
);

export default Auditoria;
