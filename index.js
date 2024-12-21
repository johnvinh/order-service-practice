const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Update these credentials to match your PostgreSQL setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'microservices_db',
  password: 'postgres',
  port: 5432,
});

// Health check
app.get('/health', (req, res) => {
  res.send({ status: 'Order Service is healthy!' });
});

// Get all orders
app.get('/orders', async (req, res) => {
  try {
    const query = `
      SELECT o.id, o.user_id, u.name as user_name, o.product_id, p.name as product_name, p.price, o.quantity
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving orders');
  }
});

// Create a new order
app.post('/orders', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  try {
    // Insert new order
    const insertQuery = `
      INSERT INTO orders (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [user_id, product_id, quantity]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating order');
  }
});

// Get a single order
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT o.id, o.user_id, u.name as user_name, o.product_id, p.name as product_name, p.price, o.quantity
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      WHERE o.id = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Order not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching order');
  }
});

// Update an order
app.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, product_id, quantity } = req.body;
  try {
    const updateQuery = `
      UPDATE orders
      SET user_id = $1, product_id = $2, quantity = $3
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [user_id, product_id, quantity, id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Order not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating order');
  }
});

// Delete an order
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Order not found');
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting order');
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
