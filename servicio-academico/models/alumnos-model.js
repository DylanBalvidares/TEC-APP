import sequelize from "../db/conexionDB.js";
import { DataTypes } from "sequelize";

const Alumno = sequelize.define("alumnos", {
  id_alumno: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  dni: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },

  //FK
  id_curso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "cursos",
      key: "id_curso",
    },
  },

  //FK
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "usuarios",
      key: "id_usuario",
    },
  },

  indexes: [
    {
      name: "dni_unico",
      unique: true,
      fields: ["dni"],
    },

    {
      name: "uq_alumnos_usuario",
      unique: true,
      fields: ["id_usuario"],
    },
  ],
});

export default Alumno;
