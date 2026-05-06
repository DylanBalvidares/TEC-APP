import { DataTypes } from "sequelize";
import sequelize from "../../db/conexionDB";

const Roles = sequelize.define("roles", {
  id_rol: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  nombre_rol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Roles;
