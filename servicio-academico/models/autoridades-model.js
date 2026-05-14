import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Autoridad = sequelize.define(
  "autoridades",
  {
    id_autoridad: {
      type: DataTypes.INTEGER,
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
    cargo: {
      type: DataTypes.STRING(80), // Almacena roles como Director o Secretario
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "email_autoridad", // Asegura que no haya emails duplicados en el registro
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true, // Puede ser NULL si la autoridad aún no creó su login
      references: {
        model: "usuarios", // Referencia al microservicio de Auth
        key: "id_usuario",
      },
    },
  },
  {
    indexes: [
      {
        name: "uq_autoridades_usuario",
        unique: true,
        fields: ["id_usuario"],
      },
    ],
  },
);

export default Autoridad;
