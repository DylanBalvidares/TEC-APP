import Noticia from "./noticias-model.js";
import Comunicado from "./comunicados-model.js";
import ObjetoPerdido from "./objetos-perdidos-model.js";

/*

// Importar modelos de otros servicios para las relaciones

// ==========================================
// Relaciones: Noticias
// ==========================================
// Un usuario puede escribir muchas noticias
Usuario.hasMany(Noticia, { 
  foreignKey: "autor_id", 
  onDelete: "SET NULL" 
});

// Una noticia pertenece a un usuario (autor)
Noticia.belongsTo(Usuario, { 
  foreignKey: "autor_id",
  as: "autor"
});

// ==========================================
// Relaciones: Comunicados
// ==========================================
// Un usuario puede crear muchos comunicados
Usuario.hasMany(Comunicado, { 
  foreignKey: "autor_id", 
  onDelete: "SET NULL" 
});

// Un comunicado pertenece a un usuario (autor)
Comunicado.belongsTo(Usuario, { 
  foreignKey: "autor_id",
  as: "autor"
});

// ==========================================
// Relaciones: Objetos Perdidos
// ==========================================
// Una autoridad puede reportar muchos objetos perdidos
Autoridad.hasMany(ObjetoPerdido, { 
  foreignKey: "encontrado_por", 
  onDelete: "SET NULL" 
});

// Un objeto perdido fue encontrado por una autoridad
ObjetoPerdido.belongsTo(Autoridad, { 
  foreignKey: "encontrado_por",
  as: "reportero"
});
*/

export { Noticia, Comunicado, ObjetoPerdido };
