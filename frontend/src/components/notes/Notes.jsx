import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import NoteForm from './NoteForm';
import NoteCard from './NoteCard';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState(null);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getNotes();
            setNotes(response.notes || []);
        } catch (err) {
            console.error('Error loading notes:', err);
            setError(err.message || 'Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = () => {
        setEditingNote(null);
        setShowForm(true);
    };

    const handleEditNote = (note) => {
        setEditingNote(note);
        setShowForm(true);
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await api.deleteNote(noteId);
            setNotes(notes.filter(note => note.note_id !== noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
            alert(`Failed to delete note: ${err.message}`);
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingNote(null);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        loadNotes();
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading notes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
                        {notes.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-gray-600">
                        {notes.length === 0 && 'No notes yet. Create your first note!'}
                    </p>
                </div>
                <button
                    onClick={handleCreateNote}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                    + New Note
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error loading notes</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        onClick={loadNotes}
                        className="mt-2 text-sm underline hover:no-underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Notes Grid */}
            {notes.length === 0 && !error ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">No notes yet</h2>
                    <p className="text-gray-600 mb-6">Get started by creating your first note!</p>
                    <button
                        onClick={handleCreateNote}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                        Create Your First Note
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.note_id}
                            note={note}
                            onEdit={handleEditNote}
                            onDelete={handleDeleteNote}
                        />
                    ))}
                </div>
            )}

            {/* Note Form Modal */}
            {showForm && (
                <NoteForm
                    note={editingNote}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default Notes;
