import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Configuracion = sequelize.define(
  "configuracion",
  {
    clave: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "configuracion",
    timestamps: false,
  },
);

export default Configuracion;
