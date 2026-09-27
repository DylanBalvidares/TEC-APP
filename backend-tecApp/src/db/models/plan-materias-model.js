import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const PlanMateria = sequelize.define(
  "plan_materias",
  {
    id_plan_materia: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_plan: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: "planes_estudio",
        key: "id_plan",
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
    anio: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 1, max: 7 },
    },
    cuatrimestre: {
      type: DataTypes.ENUM("anual", "1", "2"),
      allowNull: false,
      defaultValue: "anual",
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["id_plan", "id_materia", "anio"],
      },
    ],
  },
);

export default PlanMateria;
