const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
//swager
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
app.use(cors());
app.use(express.json());

const crypto = require("crypto");

app.use((req, res, next) => {
  const rid = req.get("X-Request-Id") || crypto.randomUUID();
  req.rid = rid;
  res.setHeader("X-Request-Id", rid);
  next();
});

const rate = new Map();
const WINDOW_MS = 10_000;
const MAX_REQ = 8;

app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const now = Date.now();

  const bucket = rate.get(ip) ?? { count: 0, ts: now };
  const within = now - bucket.ts < WINDOW_MS;

  const updated = within
    ? { count: bucket.count + 1, ts: bucket.ts }
    : { count: 1, ts: now };

  rate.set(ip, updated);

  if (updated.count > MAX_REQ) {
    res.setHeader("Retry-After", "2");
    return res.status(429).json({
      error: "too_many_requests",
      code: null,
      details: null,
      requestId: req.rid
    });
  }

  next();
});
app.use(async (req, res, next) => {
  const r = Math.random();

  if (r < 0.15) {
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
  }

  if (r > 0.80) {
    const errType = Math.random() < 0.5 ? "unavailable" : "unexpected";
    const code = errType === "unavailable" ? 503 : 500;

    return res.status(code).json({
      error: errType,
      code,
      details: null,
      requestId: req.rid
    });
  }

  next();
});
 const idemStore = new Map();

app.post("/lab/orders", (req, res) => {
  const key = req.get("Idempotency-Key");

  if (!key) {
    return res.status(400).json({
      error: "idempotency_key_required",
      code: 400,
      details: "Header Idempotency-Key missing",
      requestId: req.rid
    });
  }

  if (idemStore.has(key)) {
    return res.status(201).json({
      ...idemStore.get(key),
      requestId: req.rid
    });
  }

  const order = {
    id: "ord_" + crypto.randomUUID().slice(0, 8),
    title: req.body?.title ?? "Untitled"
  };

  idemStore.set(key, order);

  return res.status(201).json({
    ...order,
    requestId: req.rid
  });
});
app.get("/lab/health", (req, res) => {
  res.json({ status: "ok", requestId: req.rid });
});




// Підключення до PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Функція для перевірки підключення до БД
async function checkDatabaseConnection() {
  try {
    console.log('🔧 Checking database connection...');
    
    // Проста перевірка підключення
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');

    // Перевірка наявності таблиць
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pizza_menu', 'orders', 'order_items')
    `);
    
    console.log('📊 Found tables:', tables.rows.map(row => row.table_name));

    // Перевірка кількості піц в меню
    const pizzaCount = await pool.query('SELECT COUNT(*) FROM pizza_menu');
    console.log('🍕 Pizzas in menu:', pizzaCount.rows[0].count);

    // Перевірка кількості замовлень
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');
    console.log('📦 Total orders:', orderCount.rows[0].count);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

//swager 


const swaggerDocument = YAML.load('./swager.yml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Endpoint для отримання піц
app.get('/items', async (req, res) => {
  try {
    console.log('📨 GET /items request received');
    const result = await pool.query('SELECT * FROM pizza_menu WHERE is_available = true ORDER BY id');
    console.log(`📊 Found ${result.rows.length} pizzas`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pizza_menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint для отримання однієї піци
app.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pizza_menu WHERE id = $1 AND is_available = true', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pizza not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching pizza:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint для створення замовлення
app.post('/orders', async (req, res) => {
  const { customerFirst, customerLast, items, total, phone, address, paymentMethod, createdAt } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Комбінуємо ім'я
    const customerName = [customerFirst, customerLast].filter(Boolean).join(' ').trim() || null;

    // Додаємо замовлення
    const orderInsert = await client.query(
      `INSERT INTO orders(total, phone, address, payment_method, created_at, customer_name, status)
       VALUES($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [total, phone, address, paymentMethod, createdAt || new Date(), customerName]
    );

    const orderId = orderInsert.rows[0].id;

    // Додаємо елементи замовлення
    const insertItemText = `INSERT INTO order_items(order_id, item_id, title, price, qty)
                            VALUES ($1, $2, $3, $4, $5)`;
    
    for (const item of items) {
      await client.query(insertItemText, [
        orderId, 
        item.id || null, 
        item.title || 'Unknown Item', 
        item.price || 0, 
        item.qty || 1
      ]);
    }

    await client.query('COMMIT');
    
    console.log(`✅ Order #${orderId} created successfully`);
    res.json({ 
      success: true, 
      id: orderId,
      message: 'Order created successfully'
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving order:', err);
    res.status(500).json({ 
      success: false,
      error: 'Could not save order',
      details: err.message 
    });
  } finally {
    client.release();
  }
});

// Endpoint для отримання всіх замовлень
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'title', oi.title,
                 'price', oi.price,
                 'qty', oi.qty
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Новий endpoint для статистики (опціонально)
app.get('/stats', async (req, res) => {
  try {
    const pizzaCount = await pool.query('SELECT COUNT(*) FROM pizza_menu WHERE is_available = true');
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');
    const totalRevenue = await pool.query('SELECT COALESCE(SUM(total), 0) as revenue FROM orders');
    
    res.json({
      available_pizzas: parseInt(pizzaCount.rows[0].count),
      total_orders: parseInt(orderCount.rows[0].count),
      total_revenue: parseFloat(totalRevenue.rows[0].revenue)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await checkDatabaseConnection();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📋 Available endpoints:`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/items`);
      console.log(`   GET  http://localhost:${PORT}/items/:id`);
      console.log(`   POST http://localhost:${PORT}/orders`);
      console.log(`   GET  http://localhost:${PORT}/orders`);
      console.log(`   GET  http://localhost:${PORT}/stats`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();