import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Calificación final de boletín: una fila = un alumno × materia × período.
// La ausencia de fila equivale a "pendiente" (nunca se auto-crea ni se
// convierte en 0 o en "sin calificar").
// tipo numerica → valor 0.0–10.0 (el 0 es válido).
// tipo sin_calificar → motivo obligatorio.
const BoletinCalificacion = sequelize.define(
  "boletin_calificaciones",
  {
    id_boletin_nota: {
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
      allowNull: false,
      references: { model: "alumnos", key: "id_alumno" },
    },
    tipo: {
      type: DataTypes.ENUM("numerica", "TED", "TEP", "TEA", "sin_calificar"),
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      validate: { min: 0.0, max: 10.0 },
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["id_periodo", "id_asignacion", "id_alumno"],
      },
    ],
  },
);

export default BoletinCalificacion;
