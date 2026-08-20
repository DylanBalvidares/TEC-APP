function comprobarPermisos(permisosRequeridos = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Si el usuario es admin (rol 9), permitir todo
    if (req.user.id_rol === 9) {
      return next();
    }

    // Verificar si el usuario tiene alguno de los permisos requeridos
    if (permisosRequeridos.length === 0) {
      return next(); // Sin permisos requeridos específicos, permitir
    }

    const tienePermiso = permisosRequeridos.some((permiso) =>
      req.user.permisos?.includes(permiso),
    );

    if (!tienePermiso) {
      return res.status(403).json({
        error: "Permisos insuficientes",
        permisosRequeridos,
      });
    }

    next();
  };
}

export default comprobarPermisos;
