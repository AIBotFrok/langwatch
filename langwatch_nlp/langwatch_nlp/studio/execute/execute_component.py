from langwatch_nlp.studio.parser import parse_component
from langwatch_nlp.studio.utils import disable_dsp_caching
from langwatch_nlp.studio.types.events import (
    Debug,
    DebugPayload,
    ExecuteComponentPayload,
    end_component_event,
    start_component_event,
)
import langwatch


async def execute_component(event: ExecuteComponentPayload):
    yield Debug(payload=DebugPayload(message="executing component"))

    node = [node for node in event.workflow.nodes if node.id == event.node_id][0]
    disable_dsp_caching()

    yield start_component_event(node, event.trace_id)

    with langwatch.trace(
        trace_id=event.trace_id, api_key=event.workflow.api_key, skip_root_span=True
    ) as trace:
        trace.autotrack_dspy()
        module = parse_component(node, event.workflow)()
        result = module(**event.inputs)

    cost = result.get_cost() if hasattr(result, "get_cost") else None

    yield end_component_event(node, event.trace_id, dict(result), cost)

    trace.send_spans()
