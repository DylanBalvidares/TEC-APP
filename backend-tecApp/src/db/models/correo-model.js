import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Correo = sequelize.define("correos_enviados", {
  id_correo: {
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
  email_destino: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  asunto: {
    type: DataTypes.STRING(255),
    allowNull: false,
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
    type: DataTypes.ENUM("enviado", "fallido"),
    allowNull: false,
    defaultValue: "enviado",
  },
  message_id: {
    type: DataTypes.STRING(255),
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
});

export default Correo;