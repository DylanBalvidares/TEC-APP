import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Permisos = sequelize.define("permisos", {
  id_permiso: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  id_rol: {
    type: DataTypes.INTEGER,
    references: {
      model: "roles",
      key: "id_rol",
    },
  },
});

export default Permisos;
