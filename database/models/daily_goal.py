from datetime import datetime, date

from database import db


class DailyGoal(db.Model):

    __tablename__ = "daily_goals"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    title = db.Column(
        db.String(100),
        nullable=False
    )

    category = db.Column(
        db.String(50),
        nullable=False
    )

    difficulty = db.Column(
        db.String(20),
        nullable=False
    )

    xp = db.Column(
        db.Integer,
        nullable=False
    )

    estimated_time = db.Column(
        db.Integer,
        nullable=True
    )

    completed = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    goal_date = db.Column(
        db.Date,
        default=date.today,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    completed_at = db.Column(
        db.DateTime,
        nullable=True
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "daily_goals",
            lazy=True
        )
    )