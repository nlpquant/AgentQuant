from typing import Optional
from pydantic import BaseModel


class TaskEntry(BaseModel):
    # key: str
    user_prompt: str
    storage_key: Optional[str] = None
    code: Optional[str] = None
    execute_status: Optional[str] = None
    execute_output: Optional[str] = None

    def to_dict(self):
        return {
            "user_prompt": self.user_prompt,
            "storage_key": self.storage_key,
            "code": self.code,
            "execute_status": self.execute_status,
            "execute_output": self.execute_output,
        }

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            user_prompt=data.get("user_prompt"),
            storage_key=data.get("storage_key"),
            code=data.get("code"),
            execute_status=data.get("execute_status"),
            execute_output=data.get("execute_output"),
        )


class OHLCVData(BaseModel):
    """OHLCV data point."""

    date: str
    timestamp: Optional[int] = None
    open: float
    high: float
    low: float
    close: float
    volume: int
