import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Horario = sequelize.define(
  "horarios",
  {
    id_horario: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_asignacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 6 },
    },
    hora_inicio: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    hora_fin: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    aula: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "horarios",
    timestamps: false,
  },
);

export default Horario;
