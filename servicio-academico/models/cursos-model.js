import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";

const Curso = sequelize.define("cursos", {
  id_curso: {
    type: DataTypes.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
  },

  nombre_curso: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  nivel: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  ciclo_lectivo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  capacidad_maxima: {
    type: DataTypes.INTEGER(11),
    allowNull: true,
  },

  aula: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },

  turno: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  id_profesor_titular: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "profesores",
      key: "id_profesor",
    },
  },

  estado: {
    type: DataTypes.ENUM("activo", "finalizado", "cancelado"),
    allowNull: true,
  },
});

export default Curso;
