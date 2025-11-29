import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authMiddleware } from "./middleware/authMiddleware";
import paymentRoutes from "./routes/paymentRoutes";
import { stripeWebhook } from "./controllers/paymentControllers";
import applicationRoutes from "./routes/applicationRoutes";
import leaseRoutes from "./routes/leaseRoutes";
import managerRoutes from "./routes/managerRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import tenantRoutes from "./routes/tenantRoutes";

/* CONFIG */
dotenv.config();
const app = express();


app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);


app.use((req, res, next) => {
  if (req.originalUrl.includes("vnp_")) {
    req.url = req.originalUrl; 
  }
  next();
});


/* NORMAL MIDDLEWARES */
app.use(express.json());                 
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors());
app.options("*", cors());                

/* ROUTES */
app.get("/", (req, res) => {
  res.send("This is home route");
});

app.use("/payment", paymentRoutes);
app.use("/applications", applicationRoutes);
app.use("/properties", propertyRoutes);
app.use("/leases", leaseRoutes);
app.use("/tenants", authMiddleware(["tenant"]), tenantRoutes);
app.use("/managers", authMiddleware(["manager"]), managerRoutes);

/* ERROR HANDLER */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Lỗi server không xác định",
  });
});

/* SERVER */
const port = Number(process.env.PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
  console.log(`Listening Webhook Stripe on: http://localhost:${port}/stripe/webhook`);
});
