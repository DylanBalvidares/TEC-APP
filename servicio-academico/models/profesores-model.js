import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Profesor = sequelize.define(
  "profesores",
  {
    id_profesor: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id_usuario",
      },
    },

    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },

    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    domicilio: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    fecha_contratacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("activo", "baja", "licencia"),
      defaultValue: "activo",
    },

    titulo_habilitante: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        name: "email_profesor",
        unique: true,
        fields: ["email"],
      },

      {
        name: "uq_profesores_usuario",
        unique: true,
        fields: ["id_usuario"],
      },
      {
        name: "uq_profesores_dni",
        unique: true,
        fields: ["dni"],
      },
      {
        name: "idx_estado",
        fields: ["estado"],
      },
      {
        name: "idx_especialidad",
        fields: ["especialidad"],
      },
    ],
  },
);

export default Profesor;
