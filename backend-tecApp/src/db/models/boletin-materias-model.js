import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Snapshot de materias aplicables: se fija al preparar la carga de un curso
// para un período, para que cambios posteriores del plan o de asignaciones
// no alteren un boletín ya iniciado.
const BoletinMateria = sequelize.define(
  "boletin_materias",
  {
    id_boletin_materia: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_periodo: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "periodos_boletin", key: "id_periodo" },
    },
    id_curso: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "cursos", key: "id_curso" },
    },
    id_asignacion: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "asignaciones", key: "id_asignacion" },
    },
    id_materia: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "materias", key: "id_materia" },
    },
    id_profesor: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "profesores", key: "id_profesor" },
    },
    id_plan: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: { model: "planes_estudio", key: "id_plan" },
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["id_periodo", "id_asignacion"],
      },
    ],
  },
);

export default BoletinMateria;
