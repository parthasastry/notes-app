import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const notesTable = process.env.TABLE_NOTES;

// Helper function to get user email from Cognito authorizer context
function getUserEmail(event) {
    console.log('Getting user email from event:', JSON.stringify(event.requestContext, null, 2));

    // API Gateway with Cognito authorizer provides user info in requestContext
    const authorizer = event.requestContext?.authorizer;

    if (authorizer?.claims?.email) {
        console.log('Found email in claims.email:', authorizer.claims.email);
        return authorizer.claims.email;
    }

    // Fallback: try to extract from claims
    if (authorizer?.claims?.['cognito:username']) {
        console.log('Found email in cognito:username:', authorizer.claims['cognito:username']);
        return authorizer.claims['cognito:username'];
    }

    // Additional fallback for different authorizer structures
    if (authorizer?.jwt?.claims?.email) {
        console.log('Found email in jwt.claims.email:', authorizer.jwt.claims.email);
        return authorizer.jwt.claims.email;
    }

    console.error('User email not found in request context. Authorizer:', JSON.stringify(authorizer, null, 2));
    throw new Error('User email not found in request context');
}

// Helper function to create CORS response
function createResponse(statusCode, body, headers = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            ...headers,
        },
        body: JSON.stringify(body),
    };
}

// CREATE - POST /notes
export async function createNote(event) {
    try {
        console.log('createNote called');
        console.log('Event body:', event.body);
        const userEmail = getUserEmail(event);
        console.log('User email:', userEmail);
        const body = JSON.parse(event.body || '{}');
        console.log('Parsed body:', body);

        if (!body.title && !body.content) {
            console.log('Validation failed: title or content required');
            return createResponse(400, { error: 'Title or content is required' });
        }

        const noteId = randomUUID();
        const now = new Date().toISOString();

        const note = {
            user_email: userEmail,
            note_id: noteId,
            title: body.title || '',
            content: body.content || '',
            tags: body.tags || [],
            created_at: now,
            updated_at: now,
        };

        await docClient.send(new PutCommand({
            TableName: notesTable,
            Item: note,
        }));

        return createResponse(201, {
            message: 'Note created successfully',
            note: {
                note_id: noteId,
                title: note.title,
                content: note.content,
                tags: note.tags,
                created_at: note.created_at,
                updated_at: note.updated_at,
            }
        });
    } catch (error) {
        console.error('Error creating note:', error);
        return createResponse(500, { error: 'Failed to create note', message: error.message });
    }
}

// READ - GET /notes or GET /notes/{note_id}
export async function getNotes(event) {
    try {
        const userEmail = getUserEmail(event);
        const noteId = event.pathParameters?.note_id;

        if (noteId) {
            // Get single note
            const result = await docClient.send(new GetCommand({
                TableName: notesTable,
                Key: {
                    user_email: userEmail,
                    note_id: noteId,
                },
            }));

            if (!result.Item) {
                return createResponse(404, { error: 'Note not found' });
            }

            return createResponse(200, {
                note: {
                    note_id: result.Item.note_id,
                    title: result.Item.title,
                    content: result.Item.content,
                    tags: result.Item.tags || [],
                    created_at: result.Item.created_at,
                    updated_at: result.Item.updated_at,
                }
            });
        } else {
            // List all notes for user
            const result = await docClient.send(new QueryCommand({
                TableName: notesTable,
                KeyConditionExpression: 'user_email = :email',
                ExpressionAttributeValues: {
                    ':email': userEmail,
                },
                ScanIndexForward: false, // Sort by created_at descending (newest first)
            }));

            const notes = (result.Items || []).map(item => ({
                note_id: item.note_id,
                title: item.title,
                content: item.content,
                tags: item.tags || [],
                created_at: item.created_at,
                updated_at: item.updated_at,
            }));

            return createResponse(200, { notes, count: notes.length });
        }
    } catch (error) {
        console.error('Error getting notes:', error);
        return createResponse(500, { error: 'Failed to get notes', message: error.message });
    }
}

// UPDATE - PUT /notes/{note_id}
export async function updateNote(event) {
    try {
        const userEmail = getUserEmail(event);
        const noteId = event.pathParameters?.note_id;

        if (!noteId) {
            return createResponse(400, { error: 'Note ID is required' });
        }

        const body = JSON.parse(event.body || '{}');
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (body.title !== undefined) {
            updateExpressions.push('#title = :title');
            expressionAttributeNames['#title'] = 'title';
            expressionAttributeValues[':title'] = body.title;
        }

        if (body.content !== undefined) {
            updateExpressions.push('#content = :content');
            expressionAttributeNames['#content'] = 'content';
            expressionAttributeValues[':content'] = body.content;
        }

        if (body.tags !== undefined) {
            updateExpressions.push('#tags = :tags');
            expressionAttributeNames['#tags'] = 'tags';
            expressionAttributeValues[':tags'] = body.tags;
        }

        if (updateExpressions.length === 0) {
            return createResponse(400, { error: 'No fields to update' });
        }

        // Always update the updated_at timestamp
        updateExpressions.push('#updated_at = :updated_at');
        expressionAttributeNames['#updated_at'] = 'updated_at';
        expressionAttributeValues[':updated_at'] = new Date().toISOString();

        const result = await docClient.send(new UpdateCommand({
            TableName: notesTable,
            Key: {
                user_email: userEmail,
                note_id: noteId,
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(note_id)',
            ReturnValues: 'ALL_NEW',
        }));

        return createResponse(200, {
            message: 'Note updated successfully',
            note: {
                note_id: result.Attributes.note_id,
                title: result.Attributes.title,
                content: result.Attributes.content,
                tags: result.Attributes.tags || [],
                created_at: result.Attributes.created_at,
                updated_at: result.Attributes.updated_at,
            }
        });
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return createResponse(404, { error: 'Note not found' });
        }
        console.error('Error updating note:', error);
        return createResponse(500, { error: 'Failed to update note', message: error.message });
    }
}

// DELETE - DELETE /notes/{note_id}
export async function deleteNote(event) {
    try {
        const userEmail = getUserEmail(event);
        const noteId = event.pathParameters?.note_id;

        if (!noteId) {
            return createResponse(400, { error: 'Note ID is required' });
        }

        await docClient.send(new DeleteCommand({
            TableName: notesTable,
            Key: {
                user_email: userEmail,
                note_id: noteId,
            },
            ConditionExpression: 'attribute_exists(note_id)',
        }));

        return createResponse(200, { message: 'Note deleted successfully' });
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return createResponse(404, { error: 'Note not found' });
        }
        console.error('Error deleting note:', error);
        return createResponse(500, { error: 'Failed to delete note', message: error.message });
    }
}

// Main handler - routes based on HTTP method and path
export const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.requestContext?.http?.path || event.resource;
    const noteId = event.pathParameters?.note_id;

    console.log('Routing - Method:', httpMethod, 'Path:', path, 'NoteId:', noteId);

    try {
        // Handle OPTIONS for CORS preflight
        if (httpMethod === 'OPTIONS') {
            return createResponse(200, { message: 'OK' });
        }

        // Route based on method and path
        // API Gateway proxy integration with proxy: true sends the full path
        // Path can be: /notes, /prod/notes, /notes/{note_id}, or /prod/notes/{note_id}
        const isNotesPath = path === '/notes' || path === '/prod/notes' || path?.startsWith('/notes/') || path?.startsWith('/prod/notes/');

        if (httpMethod === 'POST' && (path === '/notes' || path === '/prod/notes')) {
            console.log('Routing to createNote');
            return await createNote(event);
        } else if (httpMethod === 'GET' && isNotesPath && !noteId) {
            console.log('Routing to getNotes (list)');
            return await getNotes(event);
        } else if (httpMethod === 'GET' && noteId) {
            console.log('Routing to getNotes (single)');
            return await getNotes(event);
        } else if (httpMethod === 'PUT' && noteId) {
            console.log('Routing to updateNote');
            return await updateNote(event);
        } else if (httpMethod === 'DELETE' && noteId) {
            console.log('Routing to deleteNote');
            return await deleteNote(event);
        } else {
            console.log('No route matched - returning 404');
            return createResponse(404, {
                error: 'Not found',
                path,
                method: httpMethod,
                noteId,
                resource: event.resource,
                fullEvent: JSON.stringify(event, null, 2)
            });
        }
    } catch (error) {
        console.error('Handler error:', error);
        return createResponse(500, { error: 'Internal server error', message: error.message });
    }
};

