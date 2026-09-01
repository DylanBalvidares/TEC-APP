import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

const Personal = sequelize.define(
  "personal",
  {
    id_personal: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
    },
    domicilio: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "email", // Asegura que no haya emails duplicados en el registro
    },
    estado: {
      type: DataTypes.ENUM("activo", "baja", "licencia"),
      defaultValue: "activo",
    },
    id_usuario: {
      type: DataTypes.INTEGER(11),
      allowNull: true, // Puede ser NULL si el personal aún no creó su login
      references: {
        model: "usuarios", // Referencia al microservicio de Auth
        key: "id_usuario",
      },
    },

    id_cargo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cargos",
        key: "id_cargo",
      },
    },
  },
  {
    indexes: [
      {
        name: "uq_personal_usuario",
        unique: true,
        fields: ["id_usuario"],
      },
    ],
    tableName: "personal",
  },
);

export default Personal;
