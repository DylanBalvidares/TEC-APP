import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";

const Alumno = sequelize.define("alumnos", {
  id_alumno: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  //FOREIGN KEY
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "cursos",
      key: "id_curso",
    },
  },
});

export default Alumno;
