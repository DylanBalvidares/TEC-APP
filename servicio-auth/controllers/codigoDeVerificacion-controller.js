import ErrorHandler from "../ErrorHandler.js";
import CodigoVerificacion from "../models/codigoDeVerificacion-model.js";

function crearCodigoVerificacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function guardarCodigoVerificacion(info) {
  try {
    console.log(" === GUARDAR CODIGO VERIFICACION:", info);
    const { email, codigo, tipo, expiracion } = info;

    const data = await CodigoVerificacion.create(info);
    return data;
  } catch (error) {
    console.error("Error en guardarCodigoVerificacion:", error);

    throw new ErrorHandler(
      500,
      "Error interno al crear codigo de verificacion",
    );
  }
}

async function eliminarCodigoVerificacion(id) {
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
    console.error("Error en eliminarCodigoVerificacion:", error);
    throw new ErrorHandler(
      500,
      "Error interno al eliminar codigo verificacion",
    );
  }
}

async function verificarCodigoVerificacion(data) {
  try {
    const { email, codigo } = data;
    const verificarCodigo = await CodigoVerificacion.findOne({
      where: {
        email: email,
        codigo: codigo,
      },
    });

    if (!verificarCodigo) {
      throw new ErrorHandler(404, "El codigo que proporcionó es incorrecto!");
    }

    return {
      valido: true,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en verificarCodigoVerificacion:", error);
    throw new ErrorHandler(
      500,
      "Error interno al verificar codigo verificacion",
    );
  }
}

async function invalidarCodigoVerificacion(data) {
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
    console.error("Error invalidarCodigoVerificacion:", error);
    throw new ErrorHandler(500, "Error interno al invalidarCodigoVerificacion");
  }
}

export {
  crearCodigoVerificacion,
  guardarCodigoVerificacion,
  eliminarCodigoVerificacion,
  verificarCodigoVerificacion,
};
