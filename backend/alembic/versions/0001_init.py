"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-08-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    lecture_status = sa.Enum("open", "closed", name="lecture_status")

    op.create_table(
        "teachers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_teachers_email", "teachers", ["email"], unique=True)

    op.create_table(
        "lectures",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("teacher_id", sa.String(), sa.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=False),
        sa.Column("topic", sa.String(), nullable=False),
        sa.Column("join_code", sa.String(), nullable=False),
        sa.Column("status", lecture_status, nullable=False, server_default="open"),
        sa.Column("grid_rows", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("grid_cols", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_lectures_join_code", "lectures", ["join_code"], unique=True)

    op.create_table(
        "slides",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("lecture_id", sa.String(), sa.ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slide_number", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "lecture_participants",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("lecture_id", sa.String(), sa.ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("lecture_id", "participant_id", name="uq_lecture_participant"),
    )
    op.create_index("ix_lecture_participants_participant_id", "lecture_participants", ["participant_id"])

    op.create_table(
        "doubt_marks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("slide_id", sa.String(), sa.ForeignKey("slides.id", ondelete="CASCADE"), nullable=False),
        sa.Column("participant_id", sa.String(), nullable=False),
        sa.Column("row", sa.Integer(), nullable=False),
        sa.Column("col", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slide_id", "participant_id", "row", "col", name="uq_slide_participant_cell"),
    )
    op.create_index("ix_doubt_marks_participant_id", "doubt_marks", ["participant_id"])


def downgrade() -> None:
    op.drop_table("doubt_marks")
    op.drop_table("lecture_participants")
    op.drop_table("slides")
    op.drop_table("lectures")
    op.drop_table("teachers")
    sa.Enum(name="lecture_status").drop(op.get_bind(), checkfirst=True)
