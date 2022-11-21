import joi from "joi";

export async function registrationValidation(req, res, next) {
  const body = req.body;
  const user = {
    name: body.name,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
  };

  const userSchema = joi.object({
    name: joi.string().required(),
    email: joi
      .string()
      .pattern(/\S+@\S+\.\S+/)
      .required(),
    password: joi.string().required(),
    confirmPassword: joi.string().required().valid(joi.ref("password")),
  });

  const validation = userSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }
  next();
}

export async function loginValidation(req, res, next) {
  const body = req.body;
  const user = {
    email: body.email,
    password: body.password,
  };

  const userSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
  });

  const validation = userSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }
  next();
}
