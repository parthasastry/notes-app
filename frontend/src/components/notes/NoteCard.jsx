import React from 'react';

const NoteCard = ({ note, onEdit, onDelete }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const truncateContent = (content, maxLength = 150) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900 flex-1 pr-2">
                    {note.title || 'Untitled Note'}
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(note)}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        title="Edit note"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(note.note_id)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete note"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            {note.content && (
                <p className="text-gray-600 mb-4 flex-1">
                    {truncateContent(note.content)}
                </p>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Created {formatDate(note.created_at)}</span>
                    {note.updated_at !== note.created_at && (
                        <span>Updated {formatDate(note.updated_at)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteCard;

