
from datetime import datetime

from database import db


class GDSession(db.Model):
    __tablename__ = "gd_sessions"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    topic_id = db.Column(db.String(100), nullable=False)
    topic_title = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False, default="General")
    difficulty = db.Column(db.String(20), nullable=False, default="Beginner")

    duration_seconds = db.Column(db.Integer, nullable=False, default=0)

    opening_notes = db.Column(db.Text, nullable=True)
    argument_notes = db.Column(db.Text, nullable=True)
    conclusion_notes = db.Column(db.Text, nullable=True)

    rating = db.Column(db.Integer, nullable=False)
    reflection = db.Column(db.Text, nullable=True)

    completed_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = db.relationship(
        "User",
        backref=db.backref("gd_sessions", lazy=True)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "topicId": self.topic_id,
            "topicTitle": self.topic_title,
            "category": self.category,
            "difficulty": self.difficulty,
            "durationSeconds": self.duration_seconds,
            "openingNotes": self.opening_notes or "",
            "argumentNotes": self.argument_notes or "",
            "conclusionNotes": self.conclusion_notes or "",
            "rating": self.rating,
            "reflection": self.reflection or "",
            "completedAt": self.completed_at.isoformat() + "Z"
        }
