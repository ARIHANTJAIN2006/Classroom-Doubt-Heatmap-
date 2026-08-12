import base64
import random
import re
import string
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Lecture


def _subject_prefix(subject: str) -> str:
    letters = re.sub(r"[^A-Za-z]", "", subject).upper()
    return (letters + "XXX")[:3]


async def generate_join_code(db: AsyncSession, subject: str) -> str:
    prefix = _subject_prefix(subject)
    for _ in range(50):
        candidate = f"{prefix}-{random.randint(0, 999):03d}"
        result = await db.execute(select(Lecture.id).where(Lecture.join_code == candidate))
        if result.scalar_one_or_none() is None:
            return candidate
    # Extremely unlikely fallback with a wider random suffix.
    suffix = "".join(random.choices(string.digits, k=4))
    return f"{prefix}-{suffix}"


def save_slide_image(data_url: str, lecture_id: str, slide_number: int) -> str:
    """Decode a base64 PNG data URL and save it to disk, returning a public /static URL path."""
    if "," in data_url and data_url.strip().startswith("data:"):
        _, encoded = data_url.split(",", 1)
    else:
        encoded = data_url

    image_bytes = base64.b64decode(encoded)

    lecture_dir = Path(settings.static_dir) / "slides" / lecture_id
    lecture_dir.mkdir(parents=True, exist_ok=True)

    file_path = lecture_dir / f"{slide_number}.png"
    file_path.write_bytes(image_bytes)

    return f"/static/slides/{lecture_id}/{slide_number}.png"


def normalize_intensity(count: int, total_participants: int) -> float:
    if total_participants <= 0:
        return 0.0
    return round(min(count / total_participants, 1.0), 4)
