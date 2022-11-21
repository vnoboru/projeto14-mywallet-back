import joi from "joi";
import dayjs from "dayjs";
import db from "../database/db.js";

export async function postAccount(req, res) {
  const { authorization } = req.headers;
  const body = req.body;
  //Body formato de envio dos valores
  const finances = {
    description: body.description,
    value: body.value,
    type: body.type,
  };

  const userSchema = joi.object({
    description: joi.string().required(),
    value: joi.number().required(),
    type: joi.string().required(),
  });

  //validação dos dados enviados
  const type = body.type === "income" || body.type === "outcome";
  const validation = userSchema.validate(finances, { abortEarly: false });

  if (validation.error || !type) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  const token = authorization?.replace("Bearer ", "").trim();
  console.log(token);
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

    await db.collection("balances").insertOne({
      user: accountSession.user,
      date: dayjs().format("DD/MM"),
      ...finances,
    });
    res.sendStatus(201);
  } catch {
    res.status(404).send("Token inválido");
  }
}

export async function getAccount(req, res) {
  const user = res.locals;

  try {
    res.send(user).status(200);
  } catch {
    res.status(404).send("Token inválido");
  }
}
