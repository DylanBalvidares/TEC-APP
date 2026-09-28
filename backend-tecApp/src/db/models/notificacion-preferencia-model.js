import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const NotificacionPreferencia = sequelize.define(
  "notificacion_preferencias",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    canales: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: "notificacion_preferencias",
    timestamps: false,
  },
);

export default NotificacionPreferencia;
