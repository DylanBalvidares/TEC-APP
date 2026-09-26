import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const HistorialNota = sequelize.define("historial_notas", {
  id_historial: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  id_nota: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "notas",
      key: "id_nota",
    },
  },
  id_alumno: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "alumnos",
      key: "id_alumno",
    },
  },
  id_asignacion: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "asignaciones",
      key: "id_asignacion",
    },
  },
  calificacion_anterior: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
  },
  calificacion_nueva: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: false,
  },
  modificado_por: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    references: {
      model: "usuarios",
      key: "id_usuario",
    },
  },
  fecha_cambio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: "historial_notas",
  timestamps: false,
});

export default HistorialNota;
