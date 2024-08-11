import { nanoid } from "nanoid";
import type { ElasticSearchEvaluation } from "../../../tracer/types";
import type { CollectorJob } from "../../types";
import { elasticSearchEvaluationSchema } from "../../../tracer/types.generated";

export const mapEvaluations = (
  data: CollectorJob
): ElasticSearchEvaluation[] | undefined => {
  return data.evaluations?.map((evaluation) => {
    const evaluation_: ElasticSearchEvaluation = {
      ...evaluation,
      trace_id: data.traceId,
      project_id: data.projectId,
      check_id: evaluation.evaluation_id ?? `eval_${nanoid()}`,
      check_type: evaluation.type,
      check_name: evaluation.name,
      status: evaluation.status ?? (evaluation.error ? "error" : "processed"),
      timestamps: {
        ...evaluation.timestamps,
        inserted_at: Date.now(),
        updated_at: Date.now(),
      },
    };

    // reparse to remove unwanted extraneous fields
    return elasticSearchEvaluationSchema.parse(evaluation_);
  });
};
