import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const ObjetoPerdido = sequelize.define(
  "objetos_perdidos",
  {
    id_objeto: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_encontrado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    encontrado_por: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: "autoridades",
        key: "id_autoridad",
      },
    },
    estado: {
      type: DataTypes.ENUM("perdido", "encontrado", "reclamado"),
      allowNull: false,
      defaultValue: "perdido",
    },
  },
  {
    tableName: "objetos_perdidos",
    timestamps: false,
  },
);

export default ObjetoPerdido;
