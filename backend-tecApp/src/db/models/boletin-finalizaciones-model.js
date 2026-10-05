import { DataTypes } from "sequelize";
import sequelize from "../conexionDB.js";

// Estado de carga de una materia en un período. Se crea en "pendiente" al
// preparar el curso; pasa a "finalizada" con la acción explícita del profesor
// y vuelve a "en_progreso" cuando administración aprueba una reapertura.
const BoletinFinalizacion = sequelize.define(
  "boletin_finalizaciones",
  {
    id_finalizacion: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    id_periodo: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "periodos_boletin", key: "id_periodo" },
    },
    id_asignacion: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: { model: "asignaciones", key: "id_asignacion" },
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "en_progreso", "finalizada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    finalizado_por: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      references: { model: "usuarios", key: "id_usuario" },
    },
    fecha_finalizacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ["id_periodo", "id_asignacion"],
      },
    ],
  },
);

export default BoletinFinalizacion;
