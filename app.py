from flask_cors import CORS
from flask import Flask, request
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)

# ---------------- APP SETUP ----------------
app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "super-secret-key"   # change later in prod
jwt = JWTManager(app)

# ---------------- DB ----------------
def get_db():
    con = sqlite3.connect("database.db")
    con.row_factory = sqlite3.Row
    return con

with get_db() as con:
    con.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )
    """)
    con.execute("""
    CREATE TABLE IF NOT EXISTS jobs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT,
        role TEXT,
        status TEXT,
        user_id INTEGER
    )
    """)

# ---------------- HOME ----------------
@app.route("/")
def home():
    return "Job Tracker API running!"

# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data["email"]
    password = generate_password_hash(data["password"])

    try:
        with get_db() as con:
            con.execute(
                "INSERT INTO users(email, password) VALUES(?,?)",
                (email, password)
            )
        return {"message": "User registered successfully"}
    except:
        return {"error": "User already exists"}, 400

# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data["email"]
    password = data["password"]

    with get_db() as con:
        cur = con.execute(
            "SELECT id, password FROM users WHERE email=?",
            (email,)
        )
        user = cur.fetchone()

    if not user or not check_password_hash(user["password"], password):
        return {"error": "Invalid credentials"}, 401

    # ✅ IMPORTANT: identity MUST be string
    token = create_access_token(identity=str(user["id"]))

    return {"access_token": token}

# ---------------- PROTECTED ROUTE ----------------
@app.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()   # comes as string
    return {
        "message": f"Welcome user {user_id}!",
        "user_id": user_id
    }

# ---------------- ADD JOB ----------------
@app.route("/jobs", methods=["POST"])
@jwt_required()
def add_job():
    data = request.get_json(force=True)

    company = data["company"]
    role = data["role"]
    status = data["status"]

    user_id = get_jwt_identity()

    with get_db() as con:
        con.execute(
            "INSERT INTO jobs(company, role, status, user_id) VALUES(?,?,?,?)",
            (company, role, status, user_id)
        )

    return {"message": "Job added successfully"}


# ---------------- GET MY JOBS ----------------
@app.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():
    user_id = get_jwt_identity()

    with get_db() as con:
        cur = con.execute(
            "SELECT id, company, role, status FROM jobs WHERE user_id=?",
            (user_id,)
        )
        jobs = cur.fetchall()

    result = []
    for j in jobs:
        result.append({
            "id": j[0],
            "company": j[1],
            "role": j[2],
            "status": j[3]
        })

    return {"jobs": result}

@app.route("/jobs/<int:job_id>", methods=["PUT"])
@jwt_required()
def update_job(job_id):
    data = request.get_json(force=True)
    status = data["status"]

    user_id = get_jwt_identity()

    with get_db() as con:
        con.execute(
            "UPDATE jobs SET status=? WHERE id=? AND user_id=?",
            (status, job_id, user_id)
        )

    return {"message": "Job updated successfully"}

@app.route("/jobs/<int:job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    user_id = get_jwt_identity()

    with get_db() as con:
        con.execute(
            "DELETE FROM jobs WHERE id=? AND user_id=?",
            (job_id, user_id)
        )

    return {"message": "Job deleted successfully"}

@app.route("/jobs/search", methods=["GET"])
@jwt_required()
def search_jobs():
    status = request.args.get("status")
    user_id = get_jwt_identity()

    with get_db() as con:
        cur = con.execute(
            "SELECT id, company, role, status FROM jobs WHERE user_id=? AND status=?",
            (user_id, status)
        )
        rows = cur.fetchall()

    return [
        {"id": r[0], "company": r[1], "role": r[2], "status": r[3]}
        for r in rows
    ]



# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)

