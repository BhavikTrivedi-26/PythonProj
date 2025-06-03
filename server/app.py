import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Database Configuration ---
# Fetch credentials from environment variables for security
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST', 'localhost') # Default to localhost
DB_NAME = os.getenv('DB_NAME', 'quicknote_db') # Default to quicknote_db

# MySQL connection string
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable modification tracking for performance

db = SQLAlchemy(app)

# --- Database Model ---
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Note {self.title}>'

    # Method to convert Note object to dictionary for JSON serialization
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat() + 'Z' # ISO format with 'Z' for UTC
        }

# --- Database Initialization (Run once to create tables) ---
# This logic creates tables only if they don't exist, when the first request comes in.
# It replaces the deprecated @app.before_first_request.
with app.app_context():
    try:
        db.create_all()
        print("Database tables created or already exist.")
    except Exception as e:
        print(f"Error creating tables: {e}")

# --- API Endpoints ---

@app.route('/notes', methods=['GET'])
def get_notes():
    """Fetches all notes from the database."""
    notes = Note.query.order_by(Note.created_at.desc()).all()
    return jsonify([note.to_dict() for note in notes])

@app.route('/notes', methods=['POST'])
def add_note():
    """Adds a new note to the database."""
    data = request.get_json()
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'message': 'Title and content are required!'}), 400

    new_note = Note(title=data['title'], content=data['content'])
    try:
        db.session.add(new_note)
        db.session.commit()
        return jsonify(new_note.to_dict()), 201 # 201 Created
    except Exception as e:
        db.session.rollback() # Rollback in case of error
        return jsonify({'message': f'Error adding note: {e}'}), 500

@app.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """Deletes a note by its ID."""
    note = Note.query.get(note_id)
    if note is None:
        return jsonify({'message': 'Note not found!'}), 404

    try:
        db.session.delete(note)
        db.session.commit()
        return jsonify({'message': 'Note deleted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting note: {e}'}), 500

# --- Run the Flask app ---
if __name__ == '__main__':
    app.run(debug=True, port=5000) # Run on port 5000