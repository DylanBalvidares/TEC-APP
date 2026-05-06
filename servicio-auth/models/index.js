import Usuario from "./user-model";
import Roles from "./roles-model";

Usuario.belongsTo(Roles, {
  foreignKey: "id_rol",
});

Roles.hasMany(Usuario, {
  foreignKey: "id_rol",
});

export { Usuario, Roles };
