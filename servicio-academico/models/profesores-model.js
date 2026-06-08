import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Profesor = sequelize.define(
  "profesores",
  {
    id_profesor: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id_usuario",
      },
    },
  },
  {
    indexes: [
      {
        name: "email_profesor",
        unique: true,
        fields: ["email"],
      },

      {
        name: "uq_profesores_usuario",
        unique: true,
        fields: ["id_usuario"],
      },
    ],
  },
);

export default Profesor;
