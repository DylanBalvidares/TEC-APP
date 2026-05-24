import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Asignacion = sequelize.define("asignaciones", {
  id_asignacion: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  id_curso: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "cursos",
      key: "id_curso",
    },
  },
  id_materia: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "materias",
      key: "id_materia",
    },
  },
  id_profesor: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "profesores",
      key: "id_profesor",
    },
  },
});

export default Asignacion;
