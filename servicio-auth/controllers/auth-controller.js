import user from "../models/user-model.js";

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar si ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    // Crear usuario
    const newUser = await User.create({ username, email, password });

    res.status(201).json({
      message: "Usuario creado con éxito",
      userId: newUser.id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};
