
from datetime import datetime

from database import db


class HackathonParticipation(db.Model):
    """A student's record of participating in a hackathon."""

    __tablename__ = "hackathon_participations"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    event_name = db.Column(db.String(200), nullable=False)
    organizer = db.Column(db.String(200), nullable=True)

    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)

    participation_type = db.Column(
        db.String(30),
        nullable=False,
        default="online",
    )

    team_name = db.Column(db.String(150), nullable=True)
    team_role = db.Column(db.String(100), nullable=True)

    project_title = db.Column(db.String(200), nullable=True)
    project_description = db.Column(db.Text, nullable=True)
    tech_stack = db.Column(db.Text, nullable=True)

    result = db.Column(
        db.String(30),
        nullable=False,
        default="participated",
    )

    github_url = db.Column(db.String(500), nullable=True)
    demo_url = db.Column(db.String(500), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)

    experience = db.Column(db.Text, nullable=True)
    challenges = db.Column(db.Text, nullable=True)
    learnings = db.Column(db.Text, nullable=True)

    # Private by default; public display must also enforce this flag.
    is_public = db.Column(db.Boolean, nullable=False, default=False)

    # Only an administrator can change verification status.
    verification_status = db.Column(
        db.String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    xp_awarded = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class HackathonProof(db.Model):
    """Evidence submitted for a participation record."""

    __tablename__ = "hackathon_proofs"

    id = db.Column(db.Integer, primary_key=True)

    participation_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "hackathon_participations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    proof_type = db.Column(
        db.String(30),
        nullable=False,
    )  # certificate, screenshot, URL, etc.

    proof_url = db.Column(db.String(1000), nullable=True)
    file_path = db.Column(db.String(500), nullable=True)
    description = db.Column(db.String(300), nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )


class HackathonReview(db.Model):
    """Audit trail of administrator verification decisions."""

    __tablename__ = "hackathon_reviews"

    id = db.Column(db.Integer, primary_key=True)

    participation_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "hackathon_participations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    reviewer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    decision = db.Column(
        db.String(30),
        nullable=False,
    )  # approved, rejected, needs_changes

    comments = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
