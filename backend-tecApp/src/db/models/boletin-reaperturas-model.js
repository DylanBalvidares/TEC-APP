import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Solicitud de reapertura de una materia ya finalizada (alcance: una
// asignación dentro de un período). El profesor solicita; administración
// decide. Una reapertura aprobada habilita escritura hasta que la materia
// se finaliza de nuevo (fecha_decision posterior a fecha_finalizacion).
const BoletinReapertura = sequelize.define(
  "boletin_reaperturas",
  {
    id_reapertura: {
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
    motivo_solicitud: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "aprobada", "rechazada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    solicitado_por: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "usuarios", key: "id_usuario" },
    },
    decidido_por: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: { model: "usuarios", key: "id_usuario" },
    },
    motivo_decision: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_solicitud: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_decision: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
  },
);

export default BoletinReapertura;
