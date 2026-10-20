from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session,
    jsonify
)
from datetime import datetime, timezone
from database.services.leetcode_service import (
    sync_leetcode_account
)

from config import Config

from database import db, migrate

from database.models.user import User
from database.models.project import Project
from database.models.platform_account import PlatformAccount
from database.models.platform_stats import PlatformStats

from database.services.platforms.sync_service import (
    sync_codeforces_account
)

from database.services.platform_verification import (
    generate_verification_code,
    get_verification_expiry
)

from flask_bcrypt import Bcrypt

from authlib.integrations.flask_client import OAuth

from utils.decorators import admin_required
from database.models.college import College
from database.models.user_skill import UserSkill

from database.services.platforms.github_sync import (
    sync_github_account
)
from database.services.platforms.github import (
    validate_github_username
)
from database.services.platforms.gfg_sync import (
    sync_gfg_account
)
from database.models.github_stats import GitHubStats
from database.models.gfg_stats import GFGStats
from datetime import date, datetime

from database.models.daily_goal import DailyGoal

from database.models.hackathon import (
    HackathonParticipation,
    HackathonProof,
    HackathonReview,
)
from database.models.gd_session import GDSession
# =========================================================
# CREATE FLASK APPLICATION
# =========================================================

app = Flask(__name__)

# Load configuration
app.config.from_object(Config)


# =========================================================
# EXTENSIONS
# =========================================================

bcrypt = Bcrypt(app)

oauth = OAuth(app)


# =========================================================
# CODEFORCES OAUTH CONFIGURATION
# =========================================================

oauth.register(
    name="codeforces",
    client_id=app.config["CODEFORCES_CLIENT_ID"],
    client_secret=app.config["CODEFORCES_CLIENT_SECRET"],
    server_metadata_url="https://codeforces.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid"
    }
)


# =========================================================
# DATABASE
# =========================================================

db.init_app(app)
migrate.init_app(app, db)


# =========================================================
# HOME / PUBLIC ROUTES
# =========================================================

@app.route("/")
def home():
    return redirect(url_for("login"))


# =========================================================
# AUTHENTICATION
# =========================================================

# -------------------------
# LOGIN
# -------------------------

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")
        login_type = request.form.get("login_type", "student")

        print("\n========== LOGIN DEBUG ==========")
        print("Email:", email)
        print("Login Type:", login_type)

        # Find user
        user = User.query.filter_by(email=email).first()

        print("User found:", user)

        if not user:
            print("❌ USER NOT FOUND")
            flash("Invalid email or password.", "error")
            return redirect(url_for("login"))

        # Check password
        password_correct = bcrypt.check_password_hash(
            user.password_hash,
            password
        )

        print("Password correct:", password_correct)
        print("User role:", user.role)

        if not password_correct:
            print("❌ WRONG PASSWORD")
            flash("Invalid email or password.", "error")
            return redirect(url_for("login"))

        # Check selected login type
        if login_type == "student" and user.role != "student":
            print("❌ LOGIN TYPE MISMATCH: Student selected")
            flash("Please use Admin Login for this account.", "error")
            return redirect(url_for("login"))

        if login_type == "admin" and user.role != "admin":
            print("❌ LOGIN TYPE MISMATCH: Admin selected")
            flash("Please use Student Login for this account.", "error")
            return redirect(url_for("login"))

        # Create session
        session["user_id"] = user.id

        print("✅ SESSION CREATED")
        print("Session user_id:", session["user_id"])

        # Redirect according to role
        if user.role == "admin":
            print("➡️ Redirecting to ADMIN DASHBOARD")
            return redirect(url_for("admin_dashboard"))

        print("➡️ Redirecting to STUDENT DASHBOARD")
        return redirect(url_for("dashboard"))

    return render_template("auth/login.html")
# -------------------------
# LOGOUT
# -------------------------
def get_logged_in_user_id():
    """Return the authenticated user's ID, if available."""
    user_id = session.get("user_id")
    return user_id


@app.route("/api/gd/sessions", methods=["GET"])
def get_gd_sessions():
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({"error": "Please log in first."}), 401

    sessions = (
        GDSession.query
        .filter_by(user_id=user_id)
        .order_by(GDSession.completed_at.desc())
        .all()
    )

    return jsonify({
        "sessions": [item.to_dict() for item in sessions]
    }), 200


@app.route("/api/gd/sessions", methods=["POST"])
def save_gd_session():
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({"error": "Please log in first."}), 401

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON object is required."}), 400

    required_fields = [
        "topicId",
        "topicTitle",
        "rating",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] is None
    ]

    if missing_fields:
        return jsonify({
            "error": "Missing required fields.",
            "fields": missing_fields
        }), 400

    try:
        rating = int(data["rating"])
        duration = int(data.get("durationSeconds", 0))
        topic_id = str(data["topicId"]).strip()
        topic_title = str(data["topicTitle"]).strip()

        if not topic_id or not topic_title:
            raise ValueError("Topic ID and title cannot be empty.")

        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5.")

        if duration < 0:
            raise ValueError("Duration cannot be negative.")

        if duration > 86400:
            raise ValueError("Duration exceeds the allowed limit.")

    except (ValueError, TypeError, OverflowError) as exc:
        return jsonify({"error": str(exc) or "Invalid session data."}), 400

    def optional_text(field, limit):
        value = data.get(field, "")
        if not isinstance(value, str):
            raise ValueError(f"{field} must be text.")
        value = value.strip()
        if len(value) > limit:
            raise ValueError(f"{field} is too long.")
        return value or None

    try:
        category = optional_text("category", 50) or "General"
        difficulty = optional_text("difficulty", 20) or "Beginner"
        opening_notes = optional_text("openingNotes", 10000)
        argument_notes = optional_text("argumentNotes", 10000)
        conclusion_notes = optional_text("conclusionNotes", 10000)
        reflection = optional_text("reflection", 5000)

        completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        supplied_date = data.get("completedAt")

        if supplied_date:
            if not isinstance(supplied_date, str):
                raise ValueError("completedAt must be an ISO date string.")

            completed_at = datetime.fromisoformat(
                supplied_date.replace("Z", "+00:00")
            ).replace(tzinfo=None)

        gd_session = GDSession(
            user_id=user_id,
            topic_id=topic_id,
            topic_title=topic_title,
            category=category,
            difficulty=difficulty,
            duration_seconds=duration,
            opening_notes=opening_notes,
            argument_notes=argument_notes,
            conclusion_notes=conclusion_notes,
            rating=rating,
            reflection=reflection,
            completed_at=completed_at,
        )

        db.session.add(gd_session)
        db.session.commit()

        return jsonify({
            "message": "GD session saved successfully.",
            "session": gd_session.to_dict()
        }), 201

    except ValueError as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), 400

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to save GD session.")
        return jsonify({"error": "Could not save the GD session."}), 500


@app.route("/api/gd/sessions", methods=["DELETE"])
def delete_gd_sessions():
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({"error": "Please log in first."}), 401

    try:
        GDSession.query.filter_by(user_id=user_id).delete(
            synchronize_session=False
        )
        db.session.commit()

        return jsonify({
            "message": "GD practice history cleared."
        }), 200

    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to clear GD history.")
        return jsonify({"error": "Could not clear GD history."}), 500
@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out successfully.",
        "success"
    )

    return redirect(
        url_for("login")
    )


# -------------------------
# SIGNUP
# -------------------------

@app.route("/signup", methods=["GET", "POST"])
def signup():
    

    if request.method == "POST":

        full_name = request.form.get("full_name")
        roll_number = request.form.get("roll_number")
        email = request.form.get("email")
        branch = request.form.get("branch")
        year = request.form.get("year")
        password = request.form.get("password")
        
        confirm_password = request.form.get(
            "confirm_password"
        )
        signup_type = request.form.get("signup_type", "student")
        college_id = request.form.get("college_id")
        print("SIGNUP TYPE:", signup_type)
        print("COLLEGE ID:", college_id)
        print("EMAIL:", email)
        terms = request.form.get("terms")

        # =========================================
        # VALIDATION
        # =========================================

        if signup_type == "student":

            if not all([
                full_name,
                roll_number,
                email,
                branch,
                year,
                password,
                confirm_password,
                terms,
                college_id
            ]):
                flash(
                    "Please fill in all student fields.",
                    "error"
                )
                return redirect(url_for("signup"))

        else:

            if not all([
                full_name,
                email,
                password,
                confirm_password,
                terms,
                college_id
            ]):
                flash(
                    "Please fill in all admin fields.",
                    "error"
                )
                return redirect(url_for("signup"))

            

        if password != confirm_password:

            flash(
                "Passwords do not match.",
                "error"
            )

            return redirect(
                url_for("signup")
            )

        # =========================================
        # CHECK EXISTING EMAIL
        # =========================================

        existing_email = User.query.filter_by(
            email=email
        ).first()

        if existing_email:

            flash(
                "An account with this email already exists.",
                "error"
            )

            return redirect(
                url_for("signup")
            )

        # =========================================
        # CHECK EXISTING ROLL NUMBER
        # =========================================

        if signup_type == "student":

            existing_roll = User.query.filter_by(
                roll_number=roll_number
            ).first()

            if existing_roll:
                flash(
                    "This roll number is already registered.",
                    "error"
                )
                return redirect(
                    url_for("signup")
                )

        # =========================================
        # HASH PASSWORD
        # =========================================

        hashed_password = (
            bcrypt
            .generate_password_hash(password)
            .decode("utf-8")
        )

        # =========================================
        # CREATE USER
        # =========================================

        new_user = User(
            full_name=full_name,
            roll_number=roll_number,
            email=email,
            branch=branch,
            year=year,
            password_hash=hashed_password,
            college_id=int(college_id),
            role=signup_type
        )

        db.session.add(new_user)
        db.session.commit()

        session["user_id"] = new_user.id

        return redirect(
            url_for("welcome")
        )


    colleges = College.query.order_by(
        College.name.asc()
    ).all()

    return render_template(
        "auth/signup.html",
        colleges=colleges
    )


# -------------------------
# FORGOT PASSWORD
# -------------------------

@app.route("/forgot-password")
def forgot_password():

    return render_template(
        "auth/forgot-password.html"
    )


# -------------------------
# OTP
# -------------------------

@app.route("/otp")
def otp():

    return render_template(
        "auth/otp.html"
    )


# -------------------------
# RESET PASSWORD
# -------------------------

@app.route("/reset-password")
def reset_password():

    return render_template(
        "auth/reset-password.html"
    )


# -------------------------
# SUCCESS
# -------------------------

@app.route("/success")
def success():

    return render_template(
        "auth/success.html"
    )


# =========================================================
# ADMIN
# =========================================================
# @app.route("/debug/users")
# def debug_users():
#     users = User.query.all()

#     for user in users:
#         print(user.__dict__)

#     return f"Total users: {len(users)}"
# -------------------------
# ADMIN DASHBOARD
# -------------------------

@app.route("/admin/dashboard")
@admin_required
def admin_dashboard():

    user = User.query.get(
        session["user_id"]
    )

    college = user.college

    # =========================================
    # TOTAL STUDENTS
    # =========================================

    total_students = User.query.filter_by(
        college_id=college.id,
        role="student"
    ).count()

    # =========================================
    # TOTAL PROJECTS
    # =========================================

    total_projects = Project.query.join(
        User,
        Project.user_id == User.id
    ).filter(
        User.college_id == college.id,
        User.role == "student"
    ).count()

    # =========================================
    # TOTAL PROBLEMS
    # =========================================

    total_problems = db.session.query(
        db.func.coalesce(
            db.func.sum(
                PlatformStats.unique_problems_solved
            ),
            0
        )
    ).join(
        PlatformAccount,
        PlatformStats.platform_account_id
        == PlatformAccount.id
    ).join(
        User,
        PlatformAccount.user_id
        == User.id
    ).filter(
        User.college_id == college.id,
        User.role == "student"
    ).scalar()

    # =========================================
    # TOTAL SUBMISSIONS
    # =========================================

    total_submissions = db.session.query(
        db.func.coalesce(
            db.func.sum(
                PlatformStats.total_submissions
            ),
            0
        )
    ).join(
        PlatformAccount,
        PlatformAccount.id
        == PlatformStats.platform_account_id
    ).join(
        User,
        PlatformAccount.user_id
        == User.id
    ).filter(
        User.college_id == college.id,
        User.role == "student"
    ).scalar()

    return render_template(
        "admin/dashboard.html",
        college=college,
        total_students=total_students,
        total_projects=total_projects,
        total_problems=total_problems,
        total_submissions=total_submissions
    )


# -------------------------
# ADMIN - STUDENTS
# -------------------------

@app.route("/admin/students")
@admin_required
def admin_students():

    admin = User.query.get(
        session["user_id"]
    )
    

    students = User.query.filter_by(
        college_id=admin.college_id,
        role="student"
    ).order_by(
        User.full_name.asc()
    ).all()
    
    student_project_counts = {}

    for student in students:

        student_project_counts[student.id] = Project.query.filter_by(
            user_id=student.id
        ).count()
        
    student_coding_stats = {}

    for student in students:

        accounts = PlatformAccount.query.filter_by(
            user_id=student.id
        ).all()

        total_problems = 0

        for account in accounts:

            stats = PlatformStats.query.filter_by(
                platform_account_id=account.id
            ).first()

            if stats:
                total_problems += stats.unique_problems_solved or 0

        student_coding_stats[student.id] = total_problems

    return render_template(
        "admin/students.html",
        students=students,
        college=admin.college,
        student_project_counts=student_project_counts,
        student_coding_stats=student_coding_stats
    )

@app.route("/gd")
def gd_arena():
    if "user_id" not in session:
        flash("Please login to continue.", "error")
        return redirect(url_for("login"))

    user = db.session.get(User, session["user_id"])

    if not user:
        session.clear()
        return redirect(url_for("login"))

    return render_template("gd/gd_arena.html", user=user)


@app.route("/projects")
def projects():

    if "user_id" not in session:
        return redirect(url_for("login"))

    projects = Project.query.filter_by(
        user_id=session["user_id"]
    ).order_by(Project.created_at.desc()).all()

    return render_template(
        "projects/projects.html",
        projects=projects
    )

# -------------------------
# EDIT PROJECT
# -------------------------

@app.route("/projects/edit/<int:project_id>", methods=["GET", "POST"])
def edit_project(project_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    project = Project.query.filter_by(
        id=project_id,
        user_id=session["user_id"]
    ).first_or_404()

    if request.method == "POST":

        project.title = request.form.get("title")
        project.description = request.form.get("description")
        project.github_url = request.form.get("github_url")
        project.live_url = request.form.get("live_url")
        project.tech_stack = request.form.get("tech_stack")
        project.status = request.form.get("status")

        db.session.commit()

        return redirect(url_for("projects"))

    return render_template(
        "projects/edit_project.html",
        project=project
    )


# -------------------------
# DELETE PROJECT
# -------------------------

@app.route("/projects/delete/<int:project_id>", methods=["POST"])
def delete_project(project_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    project = Project.query.filter_by(
        id=project_id,
        user_id=session["user_id"]
    ).first_or_404()

    db.session.delete(project)
    db.session.commit()

    return redirect(url_for("projects"))


@app.route("/projects/<int:project_id>")
def project_details(project_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    project = Project.query.filter_by(
        id=project_id,
        user_id=session["user_id"]
    ).first_or_404()

    return render_template(
        "projects/project_details.html",
        project=project
    )
    

@app.route("/admin/leaderboard")
@admin_required
def admin_leaderboard():

    admin = User.query.get(session["user_id"])

    students = User.query.filter_by(
        college_id=admin.college_id,
        role="student"
    ).order_by(
        User.total_xp.desc()
    ).all()

    return render_template(
        "admin/leaderboard.html",
        students=students,
        college=admin.college
    )


# =========================================================
# STUDENT DASHBOARD
# =========================================================

@app.route("/dashboard")
def dashboard():

    # =========================================
    # CHECK LOGIN
    # =========================================

    if "user_id" not in session:

        flash(
            "Please login to access your dashboard.",
            "error"
        )

        return redirect(
            url_for("login")
        )

    # =========================================
    # GET USER
    # =========================================

    user = User.query.get(
        session["user_id"]
    )

    if not user:

        session.clear()

        return redirect(
            url_for("login")
        )

    # =========================================
    # PROJECT COUNT
    # =========================================

    project_count = Project.query.filter_by(
        user_id=user.id
    ).count()

    # =========================================
    # CODEFORCES ACCOUNT
    # =========================================

    platform_stats = []

    connected_accounts = PlatformAccount.query.filter_by(
        user_id=user.id
    ).all()

    for account in connected_accounts:

        stats = PlatformStats.query.filter_by(
            platform_account_id=account.id
        ).first()

        if stats:
            platform_stats.append({
                "platform": account.platform,
                "username": account.username,
                "stats": stats
            })

    # =========================================
    # CONNECTED ACCOUNTS
    # =========================================

    connected_accounts = PlatformAccount.query.filter_by(
        user_id=user.id
    ).all()

    return render_template(
        "dashboard/dashboard.html",
        user=user,
        project_count=project_count,
        platform_stats=platform_stats
    )


# =========================================================
# profile
# =========================================================

@app.route("/profile")
def profile():

    if "user_id" not in session:
        return redirect(url_for("login"))

    user = User.query.get(session["user_id"])

    if not user:
        session.clear()
        return redirect(url_for("login"))

    accounts = PlatformAccount.query.filter_by(
        user_id=user.id
    ).all()

    profile_stats = []

    for account in accounts:

        stats = PlatformStats.query.filter_by(
            platform_account_id=account.id
        ).first()

        profile_stats.append({
            "account": account,
            "stats": stats
        })

    projects = Project.query.filter_by(
        user_id=user.id
    ).all()

    return render_template(
        "profile/profile.html",
        user=user,
        profile_stats=profile_stats,
        projects=projects
    )

# =========================================================
# PROJECTS
# =========================================================

# -------------------------
# ADD PROJECT
# -------------------------

@app.route("/projects/add", methods=["GET", "POST"])
def add_project():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    if request.method == "POST":

        title = request.form.get("title")
        description = request.form.get("description")
        github_url = request.form.get("github_url")
        live_url = request.form.get("live_url")
        tech_stack = request.form.get("tech_stack")
        status = request.form.get("status")

        new_project = Project(
            user_id=session["user_id"],
            title=title,
            description=description,
            github_url=github_url,
            live_url=live_url,
            tech_stack=tech_stack,
            status=status
        )

        db.session.add(new_project)
        db.session.commit()

        return redirect(
            url_for("dashboard")
        )

    return render_template(
        "projects/add_project.html"
    )


# =========================================================
# CODING PLATFORMS
# =========================================================

# -------------------------
# PLATFORM ACCOUNTS
# -------------------------
@app.route("/platforms")
@app.route("/platforms")
def platforms():

    if "user_id" not in session:
        return redirect(url_for("login"))

    accounts = PlatformAccount.query.filter_by(
        user_id=session["user_id"]
    ).all()

    connected_platforms = {
        account.platform
        for account in accounts
    }

    total_problems = 0
    total_submissions = 0
    total_accepted = 0

    platform_stats = {}

    for account in accounts:

        # GitHub has its own stats table
        if account.platform == "GitHub":

            stats = GitHubStats.query.filter_by(
                platform_account_id=account.id
            ).first()

        # GFG has its own stats table
        elif account.platform == "GFG":

            stats = GFGStats.query.filter_by(
                platform_account_id=account.id
            ).first()

        # LeetCode / Codeforces / other coding platforms
        else:

            stats = PlatformStats.query.filter_by(
                platform_account_id=account.id
            ).first()

        if stats:

            # GitHub doesn't contribute to coding totals
            if account.platform == "GitHub":

                pass

            # GFG contributes only solved problems
            elif account.platform == "GFG":

                total_problems += (
                    stats.problems_solved or 0
                )

            else:

                total_problems += (
                    stats.unique_problems_solved or 0
                )

                total_submissions += (
                    stats.total_submissions or 0
                )

                total_accepted += (
                    stats.accepted_submissions or 0
                )

            platform_stats[account.id] = stats

    return render_template(
        "platforms/accounts.html",
        accounts=accounts,
        platform_stats=platform_stats,
        connected_platforms=connected_platforms,
        total_problems=total_problems,
        total_submissions=total_submissions,
        total_accepted=total_accepted
    )
# -------------------------
# CONNECT PLATFORM
# -------------------------

@app.route("/platforms/connect", methods=["GET", "POST"])
def connect_platform():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    if request.method == "POST":

        platform = request.form.get("platform")
        username = request.form.get("username")

        if not platform or not username:

            flash(
                "Please fill in all fields.",
                "error"
            )

            return redirect(
                url_for("connect_platform")
            )

        profile_url = None

        if platform == "LeetCode":

            profile_url = (
                f"https://leetcode.com/u/{username}/"
            )

        elif platform == "Codeforces":

            profile_url = (
                f"https://codeforces.com/profile/{username}"
            )
            
        elif platform == "GFG":
            profile_url = (
                f"https://www.geeksforgeeks.org/user/{username}/"
            )
            
        elif platform == "GitHub":
            profile_url = (
                f"https://github.com/{username}"
            )
            
        # =========================================
        # GITHUB VALIDATION
        # =========================================

        if platform == "GitHub":

            github_user = validate_github_username(
                username
            )

            if not github_user:

                flash(
                    "GitHub username not found.",
                    "error"
                )

                return redirect(
                    url_for(
                        "connect_platform",
                        platform="GitHub"
                    )
                )

        # =========================================
        # CHECK EXISTING ACCOUNT
        # =========================================

        existing_account = PlatformAccount.query.filter_by(
            user_id=session["user_id"],
            platform=platform
        ).first()

        if existing_account:

            existing_account.username = username
            existing_account.profile_url = profile_url
            existing_account.verified = False

        else:

            new_account = PlatformAccount(
                user_id=session["user_id"],
                platform=platform,
                username=username,
                profile_url=profile_url
            )

            db.session.add(new_account)

        db.session.commit()
        print("ACCOUNT SAVED:", platform, username)

        flash(
            f"{platform} account connected successfully.",
            "success"
        )

        return redirect(url_for("connect"))

    platform = request.args.get("platform")

    return render_template(
        "platforms/connect.html",
        platform=platform
    )


# -------------------------
# VERIFY PLATFORM
# -------------------------

@app.route("/platforms/verify/<int:account_id>")
def verify_platform(account_id):

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    account = PlatformAccount.query.filter_by(
        id=account_id,
        user_id=session["user_id"]
    ).first()

    if not account:

        flash(
            "Platform account not found.",
            "error"
        )

        return redirect(
            url_for("platforms")
        )

    verification_code = (
        generate_verification_code()
    )

    expiry = (
        get_verification_expiry()
    )

    account.verification_code = verification_code
    account.verification_expires_at = expiry
    account.verification_attempts = 0
    account.verified = False

    db.session.commit()

    return render_template(
        "platforms/verify.html",
        account=account
    )


# -------------------------
# SYNC PLATFORM
# -------------------------

@app.route("/platforms/sync/<int:account_id>")
def sync_platform(account_id):

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    account = PlatformAccount.query.filter_by(
        id=account_id,
        user_id=session["user_id"]
    ).first()

    if not account:

        flash(
            "Platform account not found.",
            "error"
        )

        return redirect(
            url_for("platforms")
        )

    if account.platform == "Codeforces":

        try:

            sync_codeforces_account(
                account
            )

            flash(
                "Codeforces stats synced successfully.",
                "success"
            )

        except Exception as e:

            print(
                "Codeforces sync error:",
                e
            )

            flash(
                "Unable to sync Codeforces stats. Please try again.",
                "error"
            )

        return redirect(
            url_for("dashboard")
        )
        
    if account.platform == "LeetCode":

        try:

            sync_leetcode_account(
                account
            )

            flash(
                "LeetCode stats synced successfully.",
                "success"
            )

        except Exception as e:

            print(
                "LeetCode sync error:",
                e
            )

            flash(
                "Unable to sync LeetCode stats. Please try again.",
                "error"
            )

        return redirect(
            url_for("dashboard")
        )
    if account.platform == "GFG":

        try:

            print(
                "SYNCING GFG:",
                account.username
            )

            gfg_stats = sync_gfg_account(
                account
            )

            print(
                "GFG SYNC RESULT:",
                gfg_stats.problems_solved,
                gfg_stats.coding_score,
                gfg_stats.rank
            )

            flash(
                "GFG stats synced successfully.",
                "success"
            )

        except Exception as e:

            print(
                "GFG sync error:",
                repr(e)
            )

            flash(
                "Unable to sync GFG stats. Please try again.",
                "error"
            )

    return redirect(
        url_for("platforms")
    )
    
    if account.platform == "GitHub":

            try:

                # sync_github_account(
                #     account
                # )
                print("SYNCING GITHUB:", account.username)

                github_stats = sync_github_account(account)

                print(
                    "GITHUB SYNC RESULT:",
                    github_stats.public_repositories,
                    github_stats.stars,
                    github_stats.forks,
                    github_stats.repository_count
                )

                flash(
                    "GitHub stats synced successfully.",
                    "success"
                )

            except Exception as e:

                print(
                    "GitHub sync error:",
                    e
                )

                flash(
                    "Unable to sync GitHub stats. Please try again.",
                    "error"
                )

            return redirect(
                url_for("platforms")
            )
            
    if account.platform == "GFG":

        try:

            print(
                "SYNCING GFG:",
                account.username
            )

            gfg_stats = sync_gfg_account(
                account
            )

            print(
                "GFG SYNC RESULT:",
                gfg_stats.problems_solved,
                gfg_stats.coding_score,
                gfg_stats.rank
            )

            flash(
                "GFG stats synced successfully.",
                "success"
            )

        except Exception as e:

            print(
                "GFG sync error:",
                repr(e)
            )

            flash(
                "Unable to sync GFG stats. Please try again.",
                "error"
            )

        return redirect(
            url_for("platforms")
        )

    return redirect(
        url_for("dashboard")
    )


# =========================================================
# CODEFORCES OAUTH
# =========================================================

# -------------------------
# AUTHORIZE
# -------------------------

@app.route(
    "/platforms/codeforces/authorize/<int:account_id>"
)
def codeforces_authorize(account_id):

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    account = PlatformAccount.query.filter_by(
        id=account_id,
        user_id=session["user_id"],
        platform="Codeforces"
    ).first()

    if not account:

        flash(
            "Codeforces account not found.",
            "error"
        )

        return redirect(
            url_for("platforms")
        )

    redirect_uri = url_for(
        "codeforces_callback",
        _external=True
    )

    return oauth.codeforces.authorize_redirect(
        redirect_uri
    )


# -------------------------
# CALLBACK
# -------------------------

@app.route("/platforms/codeforces/callback")
def codeforces_callback():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    token = (
        oauth.codeforces.authorize_access_token()
    )

    user_info = token.get(
        "userinfo"
    )

    print(
        "Codeforces User Info:",
        user_info
    )

    return redirect(
        url_for("platforms")
    )


# =========================================================
# ONBOARDING
# =========================================================

# -------------------------
# WELCOME
# -------------------------

@app.route("/welcome")
def welcome():

    return render_template(
        "onboarding/welcome.html"
    )


# -------------------------
# BASIC INFORMATION
# -------------------------

@app.route("/basic-info", methods=["GET", "POST"])
def basic_info():

    if "user_id" not in session:
        return redirect(url_for("signup"))

    user = User.query.get(session["user_id"])

    if not user:
        session.clear()
        return redirect(url_for("signup"))

    if request.method == "POST":

        user.full_name = request.form.get("full_name")
        user.roll_number = request.form.get("roll_number")
        user.email = request.form.get("college_email")
        user.phone_number = request.form.get("phone_number")
        user.college_id = request.form.get("college_id")
        user.branch = request.form.get("branch")
        user.year = request.form.get("year")
        user.section = request.form.get("section")

        db.session.commit()

        return redirect(url_for("skills"))

    colleges = College.query.order_by(
        College.name.asc()
    ).all()

    return render_template(
        "onboarding/basic-info.html",
        user=user,
        colleges=colleges
    )


# -------------------------
# SKILLS
# -------------------------

@app.route("/skills", methods=["GET", "POST"])
def skills():

    if "user_id" not in session:
        return redirect(url_for("login"))

    if request.method == "POST":

        selected_skills = request.form.getlist("skills")

        # Purani skills remove karo
        UserSkill.query.filter_by(
            user_id=session["user_id"]
        ).delete()

        # New selected skills save karo
        for skill in selected_skills:
            new_skill = UserSkill(
                user_id=session["user_id"],
                skill=skill
            )
            db.session.add(new_skill)

        db.session.commit()

        return redirect(url_for("connect"))

    return render_template("onboarding/skills.html")


# -------------------------
# CONNECT
# -------------------------

@app.route("/connect")
def connect():

    if "user_id" not in session:
        return redirect(url_for("login"))

    connected_accounts = PlatformAccount.query.filter_by(
        user_id=session["user_id"]
    ).all()

    connected_platforms = {
        account.platform: account
        for account in connected_accounts
    }

    return render_template(
        "onboarding/connect.html",
        connected_platforms=connected_platforms
    )


# -------------------------
# COMPLETE
# -------------------------

@app.route("/complete")
def complete():

    return render_template(
        "onboarding/complete.html"
    )

# =========================================================

# =========================================================
# DAILY GOALS API
# =========================================================

DAILY_GOAL_XP_LIMIT = 200

GOAL_XP = {
    "Easy": 10,
    "Medium": 25,
    "Hard": 50,
    "Epic": 100
}


def goal_to_dict(goal):
    return {
        "id": goal.id,
        "title": goal.title,
        "category": goal.category,
        "difficulty": goal.difficulty,
        "xp": goal.xp,
        "estimatedTime": goal.estimated_time,
        "completed": goal.completed,
        "goalDate": goal.goal_date.isoformat(),
        "createdAt": (
            goal.created_at.isoformat()
            if goal.created_at else None
        ),
        "completedAt": (
            goal.completed_at.isoformat()
            if goal.completed_at else None
        )
    }


def get_daily_goals_xp(user_id, goal_date):
    goals = DailyGoal.query.filter_by(
        user_id=user_id,
        goal_date=goal_date,
        completed=True
    ).all()

    return sum(goal.xp for goal in goals)


# GET: Load goals for a date
@app.route("/api/goals", methods=["GET"])
def get_daily_goals():

    if "user_id" not in session:
        return jsonify({"error": "Please log in."}), 401

    try:
        goal_date = date.fromisoformat(
            request.args.get(
                "date",
                date.today().isoformat()
            )
        )
    except ValueError:
        return jsonify({"error": "Invalid date."}), 400

    goals = DailyGoal.query.filter_by(
        user_id=session["user_id"],
        goal_date=goal_date
    ).order_by(DailyGoal.created_at.asc()).all()

    return jsonify({
        "goals": [goal_to_dict(goal) for goal in goals],
        "todayXP": get_daily_goals_xp(
            session["user_id"], goal_date
        ),
        "dailyLimit": DAILY_GOAL_XP_LIMIT
    }), 200


# POST: Create a goal
@app.route("/api/goals", methods=["POST"])
def create_daily_goal():

    if "user_id" not in session:
        return jsonify({"error": "Please log in."}), 401

    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    category = str(data.get("category", "")).strip()
    difficulty = str(data.get("difficulty", "")).strip()

    if not title or not category or not difficulty:
        return jsonify({
            "error": "Title, category and difficulty are required."
        }), 400

    if len(title) > 100 or len(category) > 50:
        return jsonify({
            "error": "Title or category is too long."
        }), 400

    if difficulty not in GOAL_XP:
        return jsonify({"error": "Invalid difficulty."}), 400

    try:
        estimated_time = int(data.get("estimatedTime", 60))
        if estimated_time < 1 or estimated_time > 1440:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({
            "error": "Estimated time must be between 1 and 1440 minutes."
        }), 400

    goal = DailyGoal(
        user_id=session["user_id"],
        title=title,
        category=category,
        difficulty=difficulty,
        xp=GOAL_XP[difficulty],
        estimated_time=estimated_time,
        completed=False,
        goal_date=date.today()
    )

    db.session.add(goal)
    db.session.commit()

    return jsonify({
        "message": "Goal created.",
        "goal": goal_to_dict(goal)
    }), 201


# PUT: Edit an uncompleted goal
@app.route("/api/goals/<int:goal_id>", methods=["PUT"])
def edit_daily_goal(goal_id):

    if "user_id" not in session:
        return jsonify({"error": "Please log in."}), 401

    goal = DailyGoal.query.filter_by(
        id=goal_id,
        user_id=session["user_id"]
    ).first_or_404()

    if goal.completed:
        return jsonify({
            "error": "Completed goals cannot be edited."
        }), 400

    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()
    category = str(data.get("category", "")).strip()
    difficulty = str(data.get("difficulty", "")).strip()

    if not title or not category or not difficulty:
        return jsonify({
            "error": "Title, category and difficulty are required."
        }), 400

    if len(title) > 100 or len(category) > 50:
        return jsonify({"error": "Title or category is too long."}), 400

    if difficulty not in GOAL_XP:
        return jsonify({"error": "Invalid difficulty."}), 400

    try:
        estimated_time = int(data.get("estimatedTime", 60))
        if estimated_time < 1 or estimated_time > 1440:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid estimated time."}), 400

    goal.title = title
    goal.category = category
    goal.difficulty = difficulty
    goal.xp = GOAL_XP[difficulty]
    goal.estimated_time = estimated_time

    db.session.commit()

    return jsonify({
        "message": "Goal updated.",
        "goal": goal_to_dict(goal)
    }), 200


# DELETE: Delete an uncompleted goal
@app.route("/api/goals/<int:goal_id>", methods=["DELETE"])
def delete_daily_goal(goal_id):

    if "user_id" not in session:
        return jsonify({"error": "Please log in."}), 401

    goal = DailyGoal.query.filter_by(
        id=goal_id,
        user_id=session["user_id"]
    ).first_or_404()

    if goal.completed:
        return jsonify({
            "error": "Completed goals cannot be deleted."
        }), 400

    db.session.delete(goal)
    db.session.commit()

    return jsonify({"message": "Goal deleted."}), 200


# POST: Complete a goal and award XP once
@app.route(
    "/api/goals/<int:goal_id>/complete",
    methods=["POST"]
)
def complete_daily_goal(goal_id):

    if "user_id" not in session:
        return jsonify({"error": "Please log in."}), 401

    goal = DailyGoal.query.filter_by(
        id=goal_id,
        user_id=session["user_id"]
    ).first_or_404()

    if goal.completed:
        return jsonify({
            "error": "This goal is already completed."
        }), 400

    earned_xp = get_daily_goals_xp(
        session["user_id"],
        goal.goal_date
    )

    if earned_xp + goal.xp > DAILY_GOAL_XP_LIMIT:
        return jsonify({
            "error": "Daily goal XP limit reached.",
            "todayXP": earned_xp,
            "dailyLimit": DAILY_GOAL_XP_LIMIT
        }), 400

    user = User.query.get(session["user_id"])

    if not user:
        session.clear()
        return jsonify({"error": "User not found."}), 401

    goal.completed = True
    goal.completed_at = datetime.utcnow()

    # Add the earned XP to the student's database total.
    user.total_xp = (user.total_xp or 0) + goal.xp

    db.session.commit()

    return jsonify({
        "message": "Goal completed!",
        "goal": goal_to_dict(goal),
        "todayXP": earned_xp + goal.xp,
        "totalXP": user.total_xp
    }), 200


# =========================================================
# HACKATHON ARENA
# =========================================================

@app.route("/hackathons")
def hackathons():
    if "user_id" not in session:
        flash("Please login to continue.", "error")
        return redirect(url_for("login"))

    user = db.session.get(User, session["user_id"])

    if not user:
        session.clear()
        return redirect(url_for("login"))

    return render_template("hackathons/hackathons.html", user=user)


@app.route("/api/hackathons", methods=["GET"])
def get_hackathons():
    if "user_id" not in session:
        return jsonify({"error": "Please login first."}), 401

    records = (
        HackathonParticipation.query
        .filter_by(user_id=session["user_id"])
        .order_by(HackathonParticipation.created_at.desc())
        .all()
    )

    return jsonify({
        "hackathons": [
            {
                "id": item.id,
                "event_name": item.event_name,
                "organizer": item.organizer,
                "project_title": item.project_title,
                "result": item.result,
                "verification_status": item.verification_status,
                "xp_awarded": item.xp_awarded,
                "is_public": item.is_public,
                "created_at": item.created_at.isoformat()
            }
            for item in records
        ]
    }), 200


@app.route("/api/hackathons", methods=["POST"])
def create_hackathon():
    if "user_id" not in session:
        return jsonify({"error": "Please login first."}), 401

    data = request.get_json(silent=True) or {}

    event_name = data.get("event_name", "").strip()

    if not event_name:
        return jsonify({"error": "Hackathon name is required."}), 400

    if len(event_name) > 200:
        return jsonify({"error": "Hackathon name must be 200 characters or fewer."}), 400

    allowed_types = {"online", "offline", "hybrid"}
    allowed_results = {"participated", "finalist", "runner_up", "winner"}

    participation_type = data.get("participation_type", "online")
    result = data.get("result", "participated")

    if participation_type not in allowed_types:
        return jsonify({"error": "Invalid participation type."}), 400

    if result not in allowed_results:
        return jsonify({"error": "Invalid hackathon result."}), 400

    def parse_optional_date(value):
        if not value:
            return None
        return date.fromisoformat(value)

    try:
        start_date = parse_optional_date(data.get("start_date"))
        end_date = parse_optional_date(data.get("end_date"))
    except (ValueError, TypeError):
        return jsonify({"error": "Please provide valid dates in YYYY-MM-DD format."}), 400

    if start_date and end_date and end_date < start_date:
        return jsonify({"error": "End date cannot be before start date."}), 400

    def optional_text(key, limit=None):
        value = data.get(key)
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError(f"{key} must be text.")
        value = value.strip()
        if limit and len(value) > limit:
            raise ValueError(f"{key} must be {limit} characters or fewer.")
        return value or None

    try:
        item = HackathonParticipation(
            user_id=session["user_id"],
            event_name=event_name,
            organizer=optional_text("organizer", 200),
            start_date=start_date,
            end_date=end_date,
            participation_type=participation_type,
            team_name=optional_text("team_name", 150),
            team_role=optional_text("team_role", 100),
            project_title=optional_text("project_title", 200),
            project_description=optional_text("project_description"),
            tech_stack=optional_text("tech_stack"),
            result=result,
            github_url=optional_text("github_url", 500),
            demo_url=optional_text("demo_url", 500),
            video_url=optional_text("video_url", 500),
            experience=optional_text("experience"),
            challenges=optional_text("challenges"),
            learnings=optional_text("learnings"),
            is_public=bool(data.get("is_public", False)),
            verification_status="pending",
            xp_awarded=0
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    db.session.add(item)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to save hackathon participation")
        return jsonify({"error": "Could not save the hackathon. Please try again."}), 500

    return jsonify({
        "message": "Hackathon submitted for verification.",
        "id": item.id,
        "verification_status": item.verification_status,
        "xp_awarded": item.xp_awarded
    }), 201
# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )