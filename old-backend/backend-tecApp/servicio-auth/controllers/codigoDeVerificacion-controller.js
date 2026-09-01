import ErrorHandler from "../ErrorHandler.js";
import CodigoVerificacion from "../models/codigoDeVerificacion-model.js";

function crearCodigoVerificacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function guardarCodigoVerificacion(info) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: guardarCodigoVerificacion");
  try {
    console.log(" === GUARDAR CODIGO VERIFICACION:", info);
    const { email, codigo, tipo, expiracion } = info;

    const data = await CodigoVerificacion.create(info);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en guardarCodigoVerificacion:", error);

    throw new ErrorHandler(
      500,
      "Error interno al crear codigo de verificacion",
    );
  }
}

async function eliminarCodigoVerificacion(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarCodigoVerificacion");
  try {
    const filasBorradas = await CodigoVerificacion.destroy({
      where: {
        id_codigo: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró el codigo especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarCodigoVerificacion:", error);
    throw new ErrorHandler(
      500,
      "Error interno al eliminar codigo verificacion",
    );
  }
}

async function verificarCodigoVerificacion(data) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: verificarCodigoVerificacion");
  try {
    const { email, codigo } = data;

    const verificarCodigo = await CodigoVerificacion.findOne({
      where: {
        email,
        codigo,
        usado: false,
      },
    });

    if (!verificarCodigo) {
      throw new ErrorHandler(
        404,
        "El código que proporcionó es incorrecto o ya fue utilizado.",
      );
    }

    if (verificarCodigo.expiracion < new Date()) {
      throw new ErrorHandler(400, "El código de verificación ha expirado.");
    }

    return {
      valido: true,
      id_entidad: verificarCodigo.id_entidad,
      rol_asociado: verificarCodigo.rol_asociado,
      email: verificarCodigo.email,
      tipo: verificarCodigo.tipo,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en verificarCodigoVerificacion:", error);

    throw new ErrorHandler(
      500,
      "Error interno al verificar el código de verificación",
    );
  }
}

async function invalidarCodigoVerificacion(data) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: invalidarCodigoVerificacion");
  try {
    const { email, codigo } = data;
    const invalidar = await CodigoVerificacion.update(
      {
        usado: true,
      },
      {
        where: {
          email: email,
          codigo: codigo,
        },
      },
    );

    if (!invalidar) {
      throw new ErrorHandler(500, "El codigo no se pudo invalidar!");
    }

    return {
      ok: true,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error invalidarCodigoVerificacion:", error);
    throw new ErrorHandler(500, "Error interno al invalidarCodigoVerificacion");
  }
}

export {
  crearCodigoVerificacion,
  guardarCodigoVerificacion,
  eliminarCodigoVerificacion,
  verificarCodigoVerificacion,
  invalidarCodigoVerificacion,
};
