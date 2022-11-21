import joi from "joi";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import db from "../database/db.js"

export async function postSignUp(req, res) {
  const body = req.body;
  //Body do cadastro
  const user = {
    name: body.name,
    email: body.email,
    password: body.password,
    confirmPassword: body.confirmPassword,
  };

  //Schema para verificar os dados enviados
  const userSchema = joi.object({
    name: joi.string().required(),
    email: joi
      .string()
      .pattern(/\S+@\S+\.\S+/)
      .required(),
    password: joi.string().required(),
    confirmPassword: joi.string().required().valid(joi.ref("password")),
  });

  //validação dos dados enviados
  const validation = userSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  try {
    //Verificação de conta cadastrada
    const checkAccount = await db
      .collection("users")
      .findOne({ email: body.email });

    if (checkAccount) {
      res.status(409).send("Usuário já foi cadastrado!");
      return;
    }

    //Criptografar a senha
    const hash = await bcrypt.hash(body.password, 10);

    //Inserindo objeto no MongoDB
    await db
      .collection("users")
      .insertOne({ name: body.name, email: body.email, password: hash });
    res.status(201).send("Usuário foi cadastrado com sucesso!");
  } catch {
    res.status(422).send("Erro ao cadastrar o usuário!");
  }
}

export async function postSignIn(req, res) {
  const body = req.body;
  //Body do login
  const user = {
    email: body.email,
    password: body.password,
  };

  //schema para verificar os dados enviados
  const userSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
  });

  //validação dos dados enviados
  const validation = userSchema.validate(user, { abortEarly: false });
  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  try {
    //Verificação da existência da conta
    const userData = await db
      .collection("users")
      .findOne({ email: body.email });

    const passwordCompare = await bcrypt.compare(
      body.password,
      userData.password
    );

    if (userData && passwordCompare) {
      const token = v4();
      console.log(token);
      //Inserindo objeto no MongoDB
      await db
        .collection("sessionsHome")
        .insertOne({ token, user: userData._id, name: userData.name });

      const user = await db.collection("sessionsHome").findOne({ token });

      delete user._id;
      res.send(userData).status(200);
    } else {
      res.status(401).send("Usuário e/ou senha estão incorretos. ");
    }
  } catch {
    res.status(401).send("Usuário e/ou senha estão incorretos. ");
  }
}

export async function deleteUser(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "").trim();
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const accountSession = await db
      .collection("sessionsHome")
      .findOne({ token });

    if (!accountSession) {
      res.sendStatus(401);
      return;
    }

    await db.collection("sessionsHome").deleteOne({ token });
    res.sendStatus(200);
  } catch {
    res.status(404).send("Token inválido");
  }
}
