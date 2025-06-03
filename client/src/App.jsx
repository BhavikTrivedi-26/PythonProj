import React, { useState, useEffect } from 'react';
import './App.css'; // Assuming you'll style it in App.css
import './index.css'; // For basic global styles

function App() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = 'http://127.0.0.1:5000'; // Our Flask backend URL

    // --- Fetch Notes ---
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/notes`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setNotes(data);
            } catch (err) {
                console.error("Failed to fetch notes:", err);
                setError("Failed to load notes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []); // Empty dependency array means this runs once on mount

    // --- Handle Add Note ---
    const handleAddNote = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!title.trim() || !content.trim()) {
            alert('Title and Content cannot be empty!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newNote = await response.json();
            setNotes([newNote, ...notes]); // Add new note to the top of the list
            setTitle(''); // Clear input fields
            setContent('');
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error("Failed to add note:", err);
            setError("Failed to add note. Please try again.");
        }
    };

    // --- Handle Delete Note ---
    const handleDeleteNote = async (id) => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            const response = await fetch(`<span class="math-inline">\{API\_URL\}/notes/</span>{id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Remove the deleted note from the state
            setNotes(notes.filter(note => note.id !== id));
            setError(null);
        } catch (err) {
            console.error("Failed to delete note:", err);
            setError("Failed to delete note. Please try again.");
        }
    };

    if (loading) return <div className="container">Loading notes...</div>;
    if (error) return <div className="container error-message">{error}</div>;

    return (
        <div className="container">
            <h1>QuickNote</h1>

            <form onSubmit={handleAddNote} className="note-form">
                <input
                    type="text"
                    placeholder="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Note Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                ></textarea>
                <button type="submit">Add Note</button>
            </form>

            <div className="notes-list">
                {notes.length === 0 ? (
                    <p className="no-notes-message">No notes yet. Add one above!</p>
                ) : (
                    notes.map(note => (
                        <div key={note.id} className="note-item">
                            <h2>{note.title}</h2>
                            <p>{note.content}</p>
                            <span className="note-date">
                                {new Date(note.created_at).toLocaleString()}
                            </span>
                            <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default App;