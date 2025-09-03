import json
import time
import logging
from pydantic import Field

from nat.builder.builder import Builder
from nat.cli.register_workflow import register_function
from nat.data_models.function import FunctionBaseConfig
from nat.data_models.component_ref import LLMRef
from nat.builder.function_info import FunctionInfo
from nat.builder.framework_enum import LLMFrameworkEnum
from agent.prompts import *
from agent.redis import redis_client

from mcp_server.models import TaskEntry

print("Agent custom functions loaded.")


logger = logging.getLogger(__name__)


class ExampleConfig(FunctionBaseConfig, name="example"):
    description: str = Field(description="Description of the example function.")
    llm_name: LLMRef = Field(description="LLM to use for the example tool.")


@register_function(
    config_type=ExampleConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN]
)
async def example(config: ExampleConfig, builder: Builder):

    llm = await builder.get_llm(
        config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN
    )

    async def _run(msg: str) -> str:
        """
        An example function that uses an LLM to summary a message.
        """
        prompt = summary_prompt.invoke({"documents": msg})
        response = await llm.ainvoke(prompt)

        return f"This is an example summary using LLM ({config.llm_name}): {response.content}"

    yield FunctionInfo.from_fn(_run, description=config.description)


class QuickPreviewConfig(FunctionBaseConfig, name="quick_preview"):
    description: str = Field(
        description="Provide a quick preview based on the user_prompt, return details if succeeded."
    )
    llm_name: LLMRef = Field(description="LLM to use for the quick preview.")


@register_function(
    config_type=QuickPreviewConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN]
)
async def quick_preview(config: QuickPreviewConfig, builder: Builder):

    llm = await builder.get_llm(
        config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN
    )

    async def _run(user_prompt: str) -> str:
        """
        A quick preview function that uses an LLM to provide a quick preview based on the user_prompt.
        """
        prompt = quick_preview_prompt.invoke(
            {
                "user_prompt": user_prompt,
                "current_date": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            },
        )
        response = await llm.ainvoke(prompt)
        return response.content

    yield FunctionInfo.from_fn(_run, description=config.description)


class CodeGeneratorConfig(FunctionBaseConfig, name="code_generator"):
    description: str = Field(description="Generate code based on the user prompt.")
    llm_name: LLMRef = Field(description="LLM to use for the code generation.")


@register_function(
    config_type=CodeGeneratorConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN]
)
async def code_generator(config: CodeGeneratorConfig, builder: Builder):

    llm = await builder.get_llm(
        config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN
    )

    async def _run(
        task_id: str,
        user_prompt: str,
        ticker: str,
        start_date: str,
        end_date: str,
        time_frame: str,
    ) -> dict:
        """
        A code generation function that uses an LLM to generate code based on the user_prompt, ticker, start_date, and end_date, then store the code into redis.
        """
        prompt = code_generator_prompt.invoke(
            {
                "user_prompt": user_prompt,
                "ticker": ticker,
                "start_date": start_date,
                "end_date": end_date,
                "time_frame": time_frame,
            },
        )
        response = await llm.ainvoke(prompt)
        if len(response.content) < 100:
            logger.warning(f"LLM response is too short: {response.content}")
        resp_json = json.loads(response.content)
        if "init_code" not in resp_json or "next_code" not in resp_json:
            logger.warning(f"LLM response is missing fields: {resp_json}")
            return {"status": "failed", "message": "Invalid LLM response"}
        if (
            "logic_summary" not in resp_json
            or "entry_conditions" not in resp_json["logic_summary"]
            or "exit_conditions" not in resp_json["logic_summary"]
        ):
            logger.warning(f"LLM response is missing fields: {resp_json}")
            return {"status": "failed", "message": "Invalid LLM response"}

        task_data = await redis_client.get(task_id)
        if task_data:
            task = TaskEntry(**json.loads(task_data))
            task.code = {
                "init_code": resp_json.get("init_code"),
                "next_code": resp_json.get("next_code"),
            }
            await redis_client.set(task_id, json.dumps(task.to_dict()), ex=3600)
        else:
            return {"status": "failed", "message": f"Task {task_id} not found"}

        return {
            "status": "success",
            "logic_summary": resp_json.get("logic_summary"),
            "message": "Code generated successfully",
        }

    yield FunctionInfo.from_fn(_run, description=config.description)
