import Usuario from "./user-model.js";
import Rol from "./roles-model.js";
import Permiso from "./permisos-model.js";
import RolPermiso from "./rol-permisos-model.js";

Usuario.belongsTo(Rol, {
  foreignKey: "id_rol",
});

Rol.hasMany(Usuario, {
  foreignKey: "id_rol",
});

// 2. Relación Roles <-> Permisos (N:M)
// Esto permite que un Rol tenga muchos Permisos y un Permiso pertenezca a muchos Roles
Rol.belongsToMany(Permiso, {
  through: RolPermiso,
  foreignKey: "id_rol",
  otherKey: "id_permiso",
});

Permiso.belongsToMany(Rol, {
  through: RolPermiso,
  foreignKey: "id_permiso",
  otherKey: "id_rol",
});

export { Usuario, Rol, Permiso, RolPermiso };
