import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Cargo = sequelize.define("cargos", {
  id_cargo: {
    type: DataTypes.INTEGER(11),
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },

  nombre_cargo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },

  descripcion: {
    type: DataTypes.TEXT,
  },
});

export default Cargo;
