import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Usuario = sequelize.define("usuarios", {
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  id_rol: {
    type: DataTypes.INTEGER,
    references: {
      model: "roles",
      key: "id_rol",
    },
  },
});

export default Usuario;
