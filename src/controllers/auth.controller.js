import bcrypt from "bcrypt";
import { v4 } from "uuid";
import db from "../database/db.js";

export async function postSignUp(req, res) {
  const body = req.body;

  try {
    const checkAccount = await db
      .collection("users")
      .findOne({ email: body.email });

    if (checkAccount) {
      res.status(409).send("Usuário já foi cadastrado!");
      return;
    }

    const hash = await bcrypt.hash(body.password, 10);

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

  try {
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
