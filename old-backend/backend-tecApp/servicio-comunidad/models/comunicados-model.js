import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Comunicado = sequelize.define(
  "comunicados",
  {
    id_comunicado: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    importancia: {
      type: DataTypes.ENUM("baja", "media", "alta"),
      allowNull: false,
      defaultValue: "media",
    },
    destino: {
      type: DataTypes.ENUM("todos", "profesores", "alumnos", "autoridades", "curso"),
      allowNull: false,
      defaultValue: "todos",
    },
    curso_destino: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fecha_publicacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    autor_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id_usuario",
      },
    },
  },
  {
    tableName: "comunicados",
    timestamps: false,
  },
);

export default Comunicado;