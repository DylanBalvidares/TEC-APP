import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Confirmaciones de lectura de comunicados: una fila por (comunicado, usuario)
// cuando el destinatario con cuenta efectivamente lo lee. La unicidad evita
// duplicados ante marcas repetidas (idempotencia).
const ComunicadoLectura = sequelize.define(
  "comunicado_lecturas",
  {
    id_lectura: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_comunicado: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leida_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "comunicado_lecturas",
    timestamps: false,
  },
);

export default ComunicadoLectura;
