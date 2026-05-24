import Usuario from "./user-model.js";
import Roles from "./roles-model.js";
import Permisos from "./permisos-model.js";
import RolPermisos from "./rol-permisos-model.js";

Usuario.belongsTo(Roles, {
  foreignKey: "id_rol",
});

Roles.hasMany(Usuario, {
  foreignKey: "id_rol",
});

// 2. Relación Roles <-> Permisos (N:M)
// Esto permite que un Rol tenga muchos Permisos y un Permiso pertenezca a muchos Roles
Roles.belongsToMany(Permisos, {
  through: RolPermisos,
  foreignKey: "id_rol",
  otherKey: "id_permiso",
});

Permisos.belongsToMany(Roles, {
  through: RolPermisos,
  foreignKey: "id_permiso",
  otherKey: "id_rol",
});

export { Usuario, Roles, Permisos, RolPermisos };
