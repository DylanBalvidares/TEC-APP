import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const MensajeWhatsapp = sequelize.define(
  "mensajes_whatsapp",
  {
    id_mensaje: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_remitente: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_destinatario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    telefono_destino: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nombre_destinatario: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    cuerpo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "enviado", "fallido", "leido"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    waba_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    error_detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_lectura: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "mensajes_whatsapp",
    timestamps: false,
  },
);

export default MensajeWhatsapp;
