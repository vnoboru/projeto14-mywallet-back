import db from "../database/db.js";

export default async function tokenValidation(req, res, next) {
  try {
    const session = await db.collection("sessionsHome").findOne({ token });

    if (!session) {
      res.sendStatus(401);
      return;
    }

    const user = await db
      .collection("balances")
      .findOne({ user: session.user })
      .toArray();
    if (!user) {
      res.sendStatus(404);
      return;
    }

    user.map((d) => {
      delete d._id;
      delete d.user;
    });
    res.locals.user = user;
    next();

  } catch {
    res.status(404).send("Token inválido");
  }
}
