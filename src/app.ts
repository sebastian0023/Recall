import cors from "cors";
import express from "express";
import path from "node:path";
import { hbsEngine } from "./lib/handlebars.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import routes from "./routes/index.js";
import viewRoutes from "./routes/view.routes.js";

const app = express();

const root = path.join(import.meta.dirname, "..");

app.engine(".hbs", hbsEngine);
app.set("view engine", ".hbs");
app.set("views", path.join(root, "views"));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(root, "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", routes);
app.use(viewRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
