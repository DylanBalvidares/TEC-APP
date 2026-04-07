import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";

const Curso = sequelize.define("cursos", {
  id_curso: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  nombre_curso: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  turno: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  aula: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Curso;
