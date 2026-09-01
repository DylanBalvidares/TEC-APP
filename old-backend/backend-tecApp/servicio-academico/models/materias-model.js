import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Materia = sequelize.define("materias", {
  id_materia: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nombre_materia: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },

  carga_horaria: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default Materia;
