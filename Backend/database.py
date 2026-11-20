
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

# Backend directory
BASE_DIR = Path(__file__).resolve().parent

# Load local environment variables
ENV_FILE = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE)

# Database configuration
MYSQL_USERNAME = os.getenv("MYSQL_USERNAME")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "smarthire")

# Use environment CA_PATH if provided;
# otherwise use the certificate bundled with the backend.
CA_PATH = os.getenv(
    "CA_PATH",
    str(BASE_DIR / "certs" / "isrgrootx1.pem")
)

# Validate configuration
if not MYSQL_USERNAME or MYSQL_PASSWORD is None:
    raise RuntimeError(
        "MYSQL_USERNAME or MYSQL_PASSWORD is missing from the environment."
    )

ca_file = Path(CA_PATH)

if not ca_file.is_file():
    raise RuntimeError(f"CA certificate file not found: {CA_PATH}")

# Build database URL
DATABASE_URL = URL.create(
    drivername="mysql+mysqlconnector",
    username=MYSQL_USERNAME,
    password=MYSQL_PASSWORD,
    host=MYSQL_HOST,
    port=MYSQL_PORT,
    database=MYSQL_DATABASE,
)

# SSL certificate verification
CONNECT_ARGS = {
    "ssl_ca": str(ca_file),
    "ssl_verify_cert": True,
    "ssl_verify_identity": True,
}

SQLALCHEMY_ECHO = os.getenv(
    "SQLALCHEMY_ECHO", "false"
).lower() == "true"

engine = create_engine(
    DATABASE_URL,
    echo=SQLALCHEMY_ECHO,
    pool_pre_ping=True,
    connect_args=CONNECT_ARGS,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
