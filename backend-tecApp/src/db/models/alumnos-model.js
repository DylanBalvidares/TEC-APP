import sequelize from "../conexionDB.js";
import { DataTypes } from "sequelize";

const Alumno = sequelize.define(
  "alumnos",
  {
    // PRIMER OBJETO: Definición estricta de las columnas físicas
    id_alumno: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
      unique: true,
    },

    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    nombre_tutor: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    telefono_tutor: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    domicilio: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    estado: {
      type: DataTypes.ENUM("activo", "egresado", "baja", "condicional"),
    },
    //FK
    id_curso: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: "cursos",
        key: "id_curso",
      },
    },

    //FK
    id_usuario: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id_usuario",
      },
    },
  },
  {
    // SEGUNDO OBJETO (Tercer argumento): Opciones de la tabla
    tableName: "alumnos", // Forzamos el nombre exacto de la tabla si es necesario
    timestamps: false, // Desactiva createdAt y updatedAt si tu tabla no los usa

    indexes: [
      {
        name: "dni_unico",
        unique: true,
        fields: ["dni"],
      },
      {
        name: "uq_alumnos_usuario",
        unique: true,
        fields: ["id_usuario"],
      },
    ],
  },
);

export default Alumno;
