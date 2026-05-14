import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Profesor = sequelize.define("profesores", {
  id_profesor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  materia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

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
});

export default Profesor;
