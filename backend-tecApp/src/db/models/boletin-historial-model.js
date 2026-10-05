import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Auditoría propia de boletines (separada de historial_notas, que sigue
// atada a la libreta numérica). Registra altas, modificaciones,
// finalizaciones y decisiones de reapertura. id_alumno es NULL en eventos
// que no son por alumno (finalizar, aprobar/rechazar).
const BoletinHistorial = sequelize.define(
  "boletin_historial",
  {
    id_boletin_historial: {
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
    id_asignacion: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "asignaciones", key: "id_asignacion" },
    },
    id_alumno: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: { model: "alumnos", key: "id_alumno" },
    },
    accion: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    valor_anterior: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    valor_nuevo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    modificado_por: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "usuarios", key: "id_usuario" },
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha_cambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    tableName: "boletin_historial",
    timestamps: false,
  },
);

export default BoletinHistorial;
