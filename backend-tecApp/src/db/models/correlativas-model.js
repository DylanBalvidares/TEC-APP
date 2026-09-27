import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Correlativa = sequelize.define(
  "correlativas",
  {
    id_correlativa: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_plan_materia: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: "plan_materias",
        key: "id_plan_materia",
      },
    },
    id_plan_materia_req: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: "plan_materias",
        key: "id_plan_materia",
      },
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["id_plan_materia", "id_plan_materia_req"],
      },
    ],
  },
);

export default Correlativa;
