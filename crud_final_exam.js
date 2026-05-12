/**
 * Student Information Management System - Server Logic
 * IT318 Final Practical Examination
 */

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool (Aiven)
const mysqlUrl = process.env.MYSQL_URL;

if (!mysqlUrl) {
    console.error('CRITICAL ERROR: MYSQL_URL environment variable is missing.');
    console.error('Please add your Aiven MySQL connection string to the environment variables.');
}

// Strip 'ssl-mode' from the URL to avoid mysql2 warnings, as it expects 'ssl' object or specific flags instead
const cleanedUrl = (mysqlUrl || '').replace(/([?&])ssl-mode=[^&]+(&?)/g, '$1').replace(/[?&]$/, '');

const pool = mysql.createPool(cleanedUrl);

// Database initialization
async function initDb() {
    if (!mysqlUrl) return;
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL UNIQUE,
                full_name VARCHAR(255) NOT NULL,
                course VARCHAR(100) NOT NULL,
                section VARCHAR(50),
                year_level INT NOT NULL,
                email_address VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Migration: Ensure 'section' column exists
        try {
            await pool.execute('ALTER TABLE students ADD COLUMN section VARCHAR(50) AFTER course');
            console.log('Database migrated: Added "section" column.');
        } catch (alterError) {
            // Ignore error 1060 (Duplicate column name)
            if (alterError.errno === 1060 || alterError.code === 'ER_DUP_FIELDNAME') {
                console.log('Database check: "section" column already exists.');
            } else {
                console.error('Auto-migration for "section" column failed:', alterError.message);
            }
        }

        console.log('MySQL Database initialized successfully');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
    }
}

// --- Auth API ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded for internal practical exam simulation
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, message: 'Authentication successful', token: 'sims-session-token-primary' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials access denied' });
    }
});

// --- CRUD API Routes ---

// Create Student
app.post('/api/students', async (req, res) => {
    const { student_id, full_name, course, section, year_level, email_address } = req.body;
    try {
        const [result] = await pool.execute(
            'INSERT INTO students (student_id, full_name, course, section, year_level, email_address) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, full_name, course, section, year_level, email_address]
        );
        res.status(201).json({ id: result.insertId, message: 'Student registered successfully' });
    } catch (error) {
        console.error('Create Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// View All Students
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Read Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Student
app.put('/api/students/:id', async (req, res) => {
    const { student_id, full_name, course, section, year_level, email_address } = req.body;
    try {
        await pool.execute(
            'UPDATE students SET student_id = ?, full_name = ?, course = ?, section = ?, year_level = ? , email_address = ? WHERE id = ?',
            [student_id, full_name, course, section, year_level, email_address, req.params.id]
        );
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Student
app.delete('/api/students/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve Static Frontend
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

async function startServer() {
    await initDb();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
