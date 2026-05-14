import Usuario from "./user-model.js";
import Roles from "./roles-model.js";

Usuario.belongsTo(Roles, {
  foreignKey: "id_rol",
});

Roles.hasMany(Usuario, {
  foreignKey: "id_rol",
});

export { Usuario, Roles };
