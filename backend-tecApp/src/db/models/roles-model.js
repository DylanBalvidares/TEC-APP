import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Rol = sequelize.define("roles", {
  id_rol: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  nombre_rol: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  es_sistema: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

export default Rol;
