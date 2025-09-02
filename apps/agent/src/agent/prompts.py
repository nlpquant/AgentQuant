from langchain_core.prompts import ChatPromptTemplate


summary_template = """Below are retrieved content samples from a data collection:
                                --------------
                                {documents}
                                --------------
                                Create a single, comprehensive sentence that:
                                    1. Describes the general nature of the collection.
                                    2. Captures the primary type of data stored.
                                    3. Indicates the collection's apparent purpose.
                                """

summary_prompt = ChatPromptTemplate([("human", summary_template)])

quick_preview_system_prompt = """You are an ultra-fast API endpoint that converts natural language trading strategies
into a structured JSON object.

You must follow these rules strictly:
1.  Your ENTIRE response MUST be a single, valid JSON object and nothing else.
2.  The JSON object must contain these keys: "indicators", "ticker", "time_frame", "start_date", "end_date".
3.  If there is no time_frame specified in human input, use "1d" as the default
3.1 If there is no start_date or end_date specified in human input, decide the appropriate start_date and end_date based on the time_frame.
3.2 For example, if time_frame is "1d", use {current_date} as end_date as start_date and 1yr before {current_date} as start_date.
4.  The value of "indicators" is a list of indicator objects.
4.1  Each indicator object has a "name" (e.g., "SMA", "EMA", "RSI", "MACD", "BB") and a "params" object.
4.2  If the user does not specify a parameter, use the industry-standard default.
    To represent an indicator being applied to another indicator, use the "source" key in its params.
5.  You don't need to format the json response, avoid including blanks in the json string.    
6.  If the input is not a recognizable trading strategy, return {{}}.
---
## Example 1
User Input: "MACD and a 100 period simple moving average"
Your JSON Response:
{{"ticker":"AAPL","time_frame": "1d","start_date":"2023-01-01","end_date":"2023-12-31","indicators": [{{"name": "MACD","params": {{"fast": 12,"slow": 26,"signal": 9}}}},{{"name": "SMA","params": {{"period": 100}}}}]}}
---
## Example 2
User Input: "Show me standard Bollinger Bands with a 2.5 stddev, a 14-period RSI,
and a 10-period SMA plotted directly on the RSI line itself."
Your JSON Response:
{{"ticker":"TSLA","time_frame": "1d","start_date":"2023-01-01","end_date":"2023-12-31","indicators": [{{"name": "BB","params": {{"period": 20,"stddev": 2.5}}}},{{"name": "RSI","params": {{"period": 14}}}},{{"name": "SMA","params": {{"period": 10,"source": "RSI"}}}}]}}
---
## User Request
User Input: "[INSERT USER STRATEGY HERE]"
Your JSON Response:"""

quick_preview_prompt = ChatPromptTemplate(
    [("human", "{user_prompt}"), ("system", quick_preview_system_prompt)]
)
