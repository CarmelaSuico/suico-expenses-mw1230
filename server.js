const express = require("express");
const mysql = require("mysql2");
 
const app = express();
const PORT = 3000;
 
/*
npm init -y
npm install express mysql2
node server.js
*/
 
app.use(express.json());
app.use(express.static(__dirname));
 
// ========================================
// Database connection
// ========================================
// CHANGE these to the credentials of your DB server.
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "s24101113_IPTExpenses",
    dateStrings: true             // keep DATE columns as "YYYY-MM-DD" strings
});
 
db.getConnection((err, conn) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }
    console.log("Connected to MySQL");
    conn.release();
});
 
function validate(body) {
    const { name, amount, category, expense_date } = body;
    if (!name || !category || !expense_date || amount === undefined || amount === "" || isNaN(amount) || Number(amount) < 0) {
        return "Name, amount, category and date are required.";
    }
    return null;
}
 
// ========================================
// READ - all expenses
// ========================================
app.get("/api/expenses", (req, res) => {
    const sql = "SELECT * FROM expenses ORDER BY expense_date DESC, id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});
 
// ========================================
// READ - one expense
// ========================================
app.get("/api/expenses/:id", (req, res) => {
    db.query("SELECT * FROM expenses WHERE id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(404).json({ message: "Expense not found" });
        res.json(results[0]);
    });
});
 
// ========================================
// CREATE
// ========================================
app.post("/api/expenses", (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
 
    const { name, amount, category, expense_date, notes } = req.body;
    const sql = `
        INSERT INTO expenses (name, amount, category, expense_date, notes)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [name, amount, category, expense_date, notes || null], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.status(201).json({ message: "Expense added successfully", id: result.insertId });
    });
});
 
// ========================================
// UPDATE
// ========================================
app.put("/api/expenses/:id", (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
 
    const { name, amount, category, expense_date, notes } = req.body;
    const sql = `
        UPDATE expenses
        SET name = ?, amount = ?, category = ?, expense_date = ?, notes = ?
        WHERE id = ?
    `;
    db.query(sql, [name, amount, category, expense_date, notes || null, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Expense not found" });
        res.json({ message: "Expense updated successfully" });
    });
});
 
// ========================================
// DELETE
// ========================================
app.delete("/api/expenses/:id", (req, res) => {
    db.query("DELETE FROM expenses WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Expense not found" });
        res.json({ message: "Expense deleted successfully" });
    });
});
 
// ========================================
// Start server
// ========================================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});