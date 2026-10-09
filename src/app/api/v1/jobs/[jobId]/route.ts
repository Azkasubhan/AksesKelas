import { ok, route } from "@/server/api";
import { getProcessingJob } from "@/server/services/ai-jobs.service";

export const runtime = "nodejs";

type P = { jobId: string };

export const GET = route<P>(
  { auth: "teacher" },
  async ({ session, params }) => {
    const job = await getProcessingJob(session!.user, params.jobId);
    return ok(job);
  },
);
