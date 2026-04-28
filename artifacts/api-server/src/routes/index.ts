import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import friendsRouter from "./friends";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import notesRouter from "./notes";
import documentsRouter from "./documents";
import messagesRouter from "./messages";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(friendsRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(notesRouter);
router.use(documentsRouter);
router.use(messagesRouter);
router.use(dashboardRouter);

export default router;
