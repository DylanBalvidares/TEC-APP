import { DataTypes } from "sequelize";
import sequelize from "../db/conexionDB.js";

const Noticia = sequelize.define(
  "noticias",
  {
    id_noticia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
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
    imagen: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    imagen_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "noticias",
    timestamps: false,
  },
);

export default Noticia;
