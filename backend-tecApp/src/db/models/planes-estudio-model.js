import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const PlanEstudio = sequelize.define("planes_estudio", {
  id_plan: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  codigo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  orientacion: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duracion_anios: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM("borrador", "vigente", "historico"),
    allowNull: false,
    defaultValue: "borrador",
  },
  fecha_vigencia_desde: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  fecha_vigencia_hasta: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
},
{
  freezeTableName: true,
});

export default PlanEstudio;
