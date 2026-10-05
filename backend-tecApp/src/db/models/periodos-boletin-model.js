import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Período de carga cuatrimestral. El ciclo lectivo se guarda como número
// (coincide con cursos.ciclo_lectivo); no hay tabla de ciclos.
// Estado: programado (aún no rige) / abierto (rige si hoy está entre las
// fechas) / cerrado (bloquea aunque las fechas lo incluyan).
const PeriodoBoletin = sequelize.define(
  "periodos_boletin",
  {
    id_periodo: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ciclo_lectivo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cuatrimestre: {
      type: DataTypes.ENUM("1", "2"),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_cierre: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("programado", "abierto", "cerrado"),
      allowNull: false,
      defaultValue: "programado",
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["ciclo_lectivo", "cuatrimestre"],
      },
    ],
  },
);

export default PeriodoBoletin;
