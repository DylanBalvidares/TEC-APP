import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Permisos = sequelize.define("permisos", {
  id_permiso: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  nombre_permiso: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
});

export default Permisos;
