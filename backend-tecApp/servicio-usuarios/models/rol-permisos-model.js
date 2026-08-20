import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const RolPermisos = sequelize.define("rol_permisos", {
  id_rol: {
    type: DataTypes.INTEGER,
    references: {
      model: "roles",
      key: "id_rol",
    },

    id_permiso: {
      type: DataTypes.INTEGER,
      references: {
        model: "permisos",
        key: "id_permiso",
      },
    },
  },
});

export default RolPermisos;
