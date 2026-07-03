import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const codigoVerificacion = sequelize.define(
  "codigos_verificacion",
  {
    id_codigo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("registro", "recuperacion_password", "cambio_email"),
      allowNull: false,
      defaultValue: "registro",
    },
    expiracion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_alumno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rol_asociado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "alumno",
    },
  },
  {
    tableName: "codigos_verificacion",
    timestamps: false,
  },
);

export default codigoVerificacion;
