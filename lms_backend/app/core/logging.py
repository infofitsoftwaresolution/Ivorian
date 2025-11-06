"""
Logging configuration for the LMS application
"""
import logging
import sys
from pathlib import Path
from typing import Any, Dict

from loguru import logger
from pydantic import BaseModel


class LogConfig(BaseModel):
    """Logging configuration"""
    
    LOGGER_NAME: str = "lms_api"
    LOG_FORMAT: str = "<level>{level: <8}</level> <green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> - <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    LOG_LEVEL: str = "INFO"
    
    # Logging config
    version: int = 1
    disable_existing_loggers: bool = False
    formatters: Dict[str, Dict[str, Any]] = {
        "default": {
            "format": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }
    handlers: Dict[str, Dict[str, Any]] = {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "file": {
            "formatter": "default",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/lms_api.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
        },
    }
    loggers: Dict[str, Dict[str, Any]] = {
        "lms_api": {
            "handlers": ["default", "file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    }


class InterceptHandler(logging.Handler):
    """
    Default handler from examples of loguru documentation.
    See https://loguru.readthedocs.io/en/stable/overview.html#entirely-compatible-with-standard-logging
    """

    def emit(self, record: logging.LogRecord) -> None:
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging():
    """Setup logging configuration"""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Remove default logger
    logger.remove()
    
    # Add console handler
    logger.add(
        sys.stderr,
        format=LogConfig().LOG_FORMAT,
        level=LogConfig().LOG_LEVEL,
        colorize=True,
    )
    
    # Add file handler
    logger.add(
        "logs/lms_api.log",
        format=LogConfig().LOG_FORMAT,
        level=LogConfig().LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
    )
    
    # Intercept standard logging
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Set loguru logger for uvicorn
    logging.getLogger("uvicorn").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    
    return logger


# Create logger instance
app_logger = setup_logging()
