import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const SolicitudEdicionNota = sequelize.define(
  "solicitudes_edicion_notas",
  {
    id_solicitud: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_personal_preceptor: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "personal", key: "id_personal" },
    },
    id_asignacion: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "asignaciones", key: "id_asignacion" },
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "aprobada", "rechazada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    fecha_solicitud: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_decision: { type: DataTypes.DATE, allowNull: true },
    id_usuario_decisor: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: { model: "usuarios", key: "id_usuario" },
    },
    fecha_expiracion: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "solicitudes_edicion_notas",
    timestamps: false,
    indexes: [
      { name: "idx_sol_edicion_preceptor", fields: ["id_personal_preceptor"] },
      { name: "idx_sol_edicion_asignacion", fields: ["id_asignacion"] },
      { name: "idx_sol_edicion_estado", fields: ["estado", "fecha_expiracion"] },
    ],
  },
);

export default SolicitudEdicionNota;
