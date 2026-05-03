import express from "express";
import cors from "cors";
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import levelTestRoutes  from "./routes/levelTest.js";
import levelTestsRouter from "./routes/levelTests.js";
import devisRouter        from "./routes/devis.js";
import contactRouter      from "./routes/contact.js";
import entrepriseRouter   from "./routes/entreprise.js";
import leadsRouter        from "./routes/leads.js";
import inscriptionsRouter from "./routes/inscriptions.js";
import simulateurRouter   from "./routes/simulateur.js";
import newsletterRoutes   from "./routes/newsletter.js";
import adminRoutes        from "./routes/adminRoutes.js";
import uploadRoutes       from "./routes/uploadRoutes.js";
import paiementsRouter    from "./routes/paiements.js";
import sondageRouter      from "./routes/sondage.js";
import coachsRouter       from "./routes/coachs.js";
import messagesRouter     from "./routes/messages.js";
import centresRouter      from "./routes/centres.js";
import blogRouter         from "./routes/blog.js";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Autorise toutes les origines localhost (3000, 3001, etc.) et les requêtes sans origin (ex: Postman)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS non autorisé pour : " + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/api", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/level-test",  levelTestRoutes);
app.use("/api/level-tests", levelTestsRouter);
app.use("/api/devis",        devisRouter);
app.use("/api/contact",      contactRouter);
app.use("/api/entreprise",   entrepriseRouter);
app.use("/api/leads",        leadsRouter);
app.use("/api/inscriptions", inscriptionsRouter);
app.use("/api/simulateur",   simulateurRouter);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/upload",    uploadRoutes);
app.use("/api/paiements", paiementsRouter);
app.use("/api/sondage",   sondageRouter);
app.use("/api/coachs",    coachsRouter);
app.use("/api/messages",  messagesRouter);
app.use("/api/centres",   centresRouter);
app.use("/api/blog",      blogRouter);

export default app;