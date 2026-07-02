import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateRouter from "./generate";
import dishRouter from "./fnb/dish";
import socialPostRouter from "./fnb/social-post";
import apologyEmailRouter from "./fnb/apology-email";
import jobListingRouter from "./fnb/job-listing";
import checkoutRouter from "./fnb/checkout";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/generate", generateRouter);
router.use("/fnb/dish", dishRouter);
router.use("/fnb/social-post", socialPostRouter);
router.use("/fnb/apology-email", apologyEmailRouter);
router.use("/fnb/job-listing", jobListingRouter);
router.use("/fnb/checkout", checkoutRouter);

export default router;
