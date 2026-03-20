import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const db = new Database("crm.db");
const JWT_SECRET = process.env.JWT_SECRET || "pillarstohome-super-secret-key-2026";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price TEXT,
    location TEXT,
    type TEXT,
    beds INTEGER,
    baths INTEGER,
    sqft INTEGER,
    image TEXT,
    featured BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'New',
    source TEXT,
    is_abandoned BOOLEAN DEFAULT 1,
    notes TEXT,
    budget TEXT,
    intent TEXT,
    score INTEGER DEFAULT 0,
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    lead_id INTEGER,
    event_type TEXT,
    page TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed settings if empty
const settingsStmt = db.prepare("SELECT COUNT(*) as count FROM settings");
const { count: settingsCount } = settingsStmt.get() as { count: number };
if (settingsCount === 0) {
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  const defaultWeights = {
    page_view: 10,
    investment_page_bonus: 20,
    listings_page_bonus: 15,
    property_page_bonus: 10,
    scroll_depth_multiplier: 5,
    variety_bonus: 5,
    name_bonus: 15,
    email_bonus: 25,
    phone_bonus: 25,
    submission_bonus: 60,
    intent_investment_bonus: 40,
    intent_selfuse_bonus: 25,
    budget_high_bonus: 120, // $10M+
    budget_mid_bonus: 70,   // $3M - $10M
    budget_low_bonus: 30    // $1M - $3M
  };
  insertSetting.run("lead_scoring_weights", JSON.stringify(defaultWeights));
}

// Database Migrations: Add missing columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(leads)").all() as any[];
const columns = tableInfo.map(c => c.name);

if (!columns.includes('budget')) {
  db.exec("ALTER TABLE leads ADD COLUMN budget TEXT");
}
if (!columns.includes('intent')) {
  db.exec("ALTER TABLE leads ADD COLUMN intent TEXT");
}
if (!columns.includes('score')) {
  db.exec("ALTER TABLE leads ADD COLUMN score INTEGER DEFAULT 0");
}
if (!columns.includes('assigned_to')) {
  db.exec("ALTER TABLE leads ADD COLUMN assigned_to INTEGER");
}

// Seed properties if empty
const stmt = db.prepare("SELECT COUNT(*) as count FROM properties");
const { count } = stmt.get() as { count: number };
if (count === 0) {
  const insertProp = db.prepare(
    "INSERT INTO properties (title, price, location, type, beds, baths, sqft, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  insertProp.run("The Opus by Omniyat", "$4,500,000", "Business Bay, Dubai", "Penthouse", 4, 5, 5200, "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", 1);
  insertProp.run("One Hyde Park", "£18,000,000", "Knightsbridge, London", "Apartment", 3, 4, 3800, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", 1);
  insertProp.run("Lodha Altamount", "₹40,000,000", "Altamount Road, Mumbai", "Villa", 5, 6, 6000, "https://images.unsplash.com/photo-1613490908679-fd456570659a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", 1);
  insertProp.run("Burj Khalifa Residence", "$2,200,000", "Downtown Dubai", "Apartment", 2, 3, 2100, "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", 0);
}

// Seed admins if empty
const adminStmt = db.prepare("SELECT COUNT(*) as count FROM admins");
const { count: adminCount } = adminStmt.get() as { count: number };
if (adminCount === 0) {
  const insertAdmin = db.prepare("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)");
  const adminHash = bcrypt.hashSync("admin123", 10);
  const agentHash = bcrypt.hashSync("agent123", 10);
  insertAdmin.run("admin", adminHash, "Super Admin");
  insertAdmin.run("agent", agentHash, "Sales Agent");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Middleware to authenticate token
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Properties
  app.get("/api/properties", (req, res) => {
    const properties = db.prepare("SELECT * FROM properties").all();
    res.json(properties);
  });

  // Single Property
  app.get("/api/properties/:id", (req, res) => {
    const property = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
    if (property) res.json(property);
    else res.status(404).json({ error: "Not found" });
  });

  // Lead Scoring Logic
  const calculateLeadScore = (sessionId: string) => {
    const events = db.prepare("SELECT event_type, page, data FROM events WHERE session_id = ?").all(sessionId) as any[];
    const lead = db.prepare("SELECT * FROM leads WHERE session_id = ?").get(sessionId) as any;
    
    if (!lead) return 0;

    const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'lead_scoring_weights'").get() as any;
    const weights = settingsRow ? JSON.parse(settingsRow.value) : {
      page_view: 10,
      investment_page_bonus: 20,
      listings_page_bonus: 15,
      property_page_bonus: 10,
      scroll_depth_multiplier: 5,
      variety_bonus: 5,
      name_bonus: 15,
      email_bonus: 25,
      phone_bonus: 25,
      submission_bonus: 60,
      intent_investment_bonus: 40,
      intent_selfuse_bonus: 25,
      budget_high_bonus: 120,
      budget_mid_bonus: 70,
      budget_low_bonus: 30
    };

    let score = 0;
    const visitedPages = new Set();
    
    // Points for engagement
    events.forEach(e => {
      if (e.event_type === 'page_view') {
        score += weights.page_view;
        visitedPages.add(e.page);
        // Bonus for high-value pages
        if (e.page === '/investment') score += weights.investment_page_bonus;
        if (e.page === '/listings') score += weights.listings_page_bonus;
        if (e.page.startsWith('/property/')) score += weights.property_page_bonus;
      }
      if (e.event_type === 'scroll_depth') {
        const depthData = JSON.parse(e.data || '{}');
        const depth = depthData.depth || 0;
        score += (depth / 25) * weights.scroll_depth_multiplier;
      }
    });

    // Points for variety of pages visited
    score += visitedPages.size * weights.variety_bonus;

    // Points for data quality
    if (lead.name) score += weights.name_bonus;
    if (lead.email) score += weights.email_bonus;
    if (lead.phone) score += weights.phone_bonus;
    if (!lead.is_abandoned) score += weights.submission_bonus;

    // Points for high-value intent
    if (lead.intent === 'Investment') score += weights.intent_investment_bonus;
    if (lead.intent === 'Self-use') score += weights.intent_selfuse_bonus;
    
    // Points for budget
    if (lead.budget === '$10M+') score += weights.budget_high_bonus;
    if (lead.budget === '$3M - $10M') score += weights.budget_mid_bonus;
    if (lead.budget === '$1M - $3M') score += weights.budget_low_bonus;

    db.prepare("UPDATE leads SET score = ? WHERE session_id = ?").run(score, sessionId);
    return score;
  };

  // Tracking Events
  app.post("/api/track", (req, res) => {
    const { sessionId, eventType, page, data } = req.body;
    const insert = db.prepare("INSERT INTO events (session_id, event_type, page, data) VALUES (?, ?, ?, ?)");
    insert.run(sessionId, eventType, page, JSON.stringify(data || {}));
    
    // Recalculate score asynchronously
    setTimeout(() => calculateLeadScore(sessionId), 0);
    
    res.json({ success: true });
  });

  // Partial Lead Capture (Abandoned Forms)
  app.post("/api/leads/partial", (req, res) => {
    const { sessionId, name, email, phone, source, budget, intent } = req.body;
    
    // Check if lead exists for this session
    const existing = db.prepare("SELECT id FROM leads WHERE session_id = ?").get(sessionId) as { id: number } | undefined;
    
    if (existing) {
      db.prepare("UPDATE leads SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), budget = COALESCE(?, budget), intent = COALESCE(?, intent), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(name, email, phone, budget, intent, existing.id);
    } else {
      db.prepare("INSERT INTO leads (session_id, name, email, phone, source, is_abandoned, budget, intent) VALUES (?, ?, ?, ?, ?, 1, ?, ?)")
        .run(sessionId, name, email, phone, source || "Website", budget, intent);
    }
    
    calculateLeadScore(sessionId);
    res.json({ success: true });
  });

  // Full Lead Submission
  app.post("/api/leads", (req, res) => {
    const { sessionId, name, email, phone, source, budget, intent } = req.body;
    
    const existing = db.prepare("SELECT id FROM leads WHERE session_id = ?").get(sessionId) as { id: number } | undefined;
    
    if (existing) {
      db.prepare("UPDATE leads SET name = ?, email = ?, phone = ?, budget = ?, intent = ?, is_abandoned = 0, status = 'New', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(name, email, phone, budget, intent, existing.id);
    } else {
      db.prepare("INSERT INTO leads (session_id, name, email, phone, source, is_abandoned, status, budget, intent) VALUES (?, ?, ?, ?, ?, 0, 'New', ?, ?)")
        .run(sessionId, name, email, phone, source || "Website", budget, intent);
    }
    
    calculateLeadScore(sessionId);
    
    // Trigger notification
    db.prepare("INSERT INTO notifications (message, type) VALUES (?, ?)")
      .run(`New high-intent lead captured: ${name || 'Unknown'} (${source || 'Website'})`, 'info');

    // Simulate Email Notification
    console.log(`[EMAIL NOTIFICATION] New Lead Submitted: ${name} (${email} / ${phone}) from ${source || 'Website'}`);
    
    res.json({ success: true });
  });

  // CRM: Get Leads
  app.get("/api/crm/leads", authenticateToken, (req, res) => {
    const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
    res.json(leads);
  });

  // CRM: Delete Lead
  app.delete("/api/crm/leads/:id", authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
    const lead = db.prepare("SELECT name FROM leads WHERE id = ?").get(req.params.id) as any;
    db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
    
    // Trigger notification
    db.prepare("INSERT INTO notifications (message, type) VALUES (?, ?)")
      .run(`Lead "${lead?.name || 'Unknown'}" deleted by ${req.user.username}`, 'alert');

    res.json({ success: true });
  });

  // CRM: Update Lead Status
  app.put("/api/crm/leads/:id", authenticateToken, (req: any, res) => {
    const { status } = req.body;
    const lead = db.prepare("SELECT name FROM leads WHERE id = ?").get(req.params.id) as any;
    db.prepare("UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
    
    // Trigger notification
    db.prepare("INSERT INTO notifications (message, type) VALUES (?, ?)")
      .run(`Lead "${lead?.name || 'Unknown'}" status updated to ${status} by ${req.user.username}`, 'info');

    res.json({ success: true });
  });

  // CRM: Assign Lead
  app.put("/api/crm/leads/:id/assign", authenticateToken, (req: any, res) => {
    const { adminId } = req.body;
    const lead = db.prepare("SELECT name FROM leads WHERE id = ?").get(req.params.id) as any;
    const admin = db.prepare("SELECT username FROM admins WHERE id = ?").get(adminId) as any;
    
    db.prepare("UPDATE leads SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(adminId, req.params.id);
    
    // Trigger notification
    db.prepare("INSERT INTO notifications (message, type) VALUES (?, ?)")
      .run(`Lead "${lead?.name || 'Unknown'}" assigned to ${admin?.username || 'None'} by ${req.user.username}`, 'info');

    res.json({ success: true });
  });

  // CRM: Delete Property
  app.delete("/api/crm/properties/:id", authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare("DELETE FROM properties WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // CRM: Add Property
  app.post("/api/crm/properties", authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
    const { title, price, location, type, beds, baths, sqft, image, featured } = req.body;
    db.prepare("INSERT INTO properties (title, price, location, type, beds, baths, sqft, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(title, price, location, type, beds, baths, sqft, image, featured ? 1 : 0);
    res.json({ success: true });
  });

  // CRM: Update Property
  app.put("/api/crm/properties/:id", authenticateToken, (req: any, res: any) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
    const { title, price, location, type, beds, baths, sqft, image, featured } = req.body;
    db.prepare("UPDATE properties SET title = ?, price = ?, location = ?, type = ?, beds = ?, baths = ?, sqft = ?, image = ?, featured = ? WHERE id = ?")
      .run(title, price, location, type, beds, baths, sqft, image, featured ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // CRM: Analytics
  app.get("/api/crm/analytics", authenticateToken, (req, res) => {
    const totalLeads = (db.prepare("SELECT COUNT(*) as count FROM leads").get() as any).count;
    const abandonedLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE is_abandoned = 1").get() as any).count;
    const convertedLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE is_abandoned = 0").get() as any).count;
    const pageViews = (db.prepare("SELECT COUNT(*) as count FROM events WHERE event_type = 'page_view'").get() as any).count;
    
    res.json({
      totalLeads,
      abandonedLeads,
      convertedLeads,
      pageViews
    });
  });

  // CRM: Get Single Lead & Timeline
  app.get("/api/crm/leads/:id", authenticateToken, (req, res) => {
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
    if (!lead) return res.status(404).json({ error: "Not found" });
    const events = db.prepare("SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC").all((lead as any).session_id);
    
    // Get property interest
    const propertyViews = db.prepare(`
      SELECT DISTINCT page FROM events 
      WHERE session_id = ? AND page LIKE '/property/%'
    `).all((lead as any).session_id) as any[];
    
    const propertyIds = propertyViews.map(v => v.page.split('/').pop());
    const properties = propertyIds.length > 0 
      ? db.prepare(`SELECT * FROM properties WHERE id IN (${propertyIds.map(() => '?').join(',')})`).all(...propertyIds)
      : [];

    res.json({ lead, events, properties });
  });

  // CRM: Lead Scoring Settings
  app.get("/api/crm/settings/scoring", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'Super Admin') return res.sendStatus(403);
    const row = db.prepare("SELECT value FROM settings WHERE key = 'lead_scoring_weights'").get() as any;
    res.json(row ? JSON.parse(row.value) : {});
  });

  app.put("/api/crm/settings/scoring", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'Super Admin') return res.sendStatus(403);
    const weights = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run("lead_scoring_weights", JSON.stringify(weights));
    
    // Recalculate all scores
    const leads = db.prepare("SELECT session_id FROM leads").all() as any[];
    leads.forEach(l => calculateLeadScore(l.session_id));
    
    res.json({ success: true });
  });

  // CRM: System Audit
  app.get("/api/crm/audit", authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'Super Admin') return res.status(403).json({ error: 'Forbidden' });
    const totalLeads = (db.prepare("SELECT COUNT(*) as count FROM leads").get() as any).count;
    const missingContact = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE email = '' AND phone = ''").get() as any).count;
    const abandonedLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE is_abandoned = 1").get() as any).count;
    
    // Find sessions with > 3 page views but no lead
    const highIntentNoLead = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT session_id FROM events 
        WHERE session_id NOT IN (SELECT session_id FROM leads) 
        GROUP BY session_id HAVING COUNT(*) > 3
      )
    `).get() as any;

    res.json({
      totalLeads,
      abandonedLeads,
      missingContact,
      highIntentNoLeadCount: highIntentNoLead.count,
      healthScore: totalLeads > 0 ? Math.round(((totalLeads - missingContact) / totalLeads) * 100) : 100
    });
  });

  app.post("/api/crm/leads/:id/insights", authenticateToken, async (req: any, res: any) => {
    const { id } = req.params;
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as any;
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const events = db.prepare("SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC").all(lead.session_id) as any[];
    const properties = db.prepare(`
      SELECT DISTINCT p.* FROM properties p
      JOIN events e ON e.data LIKE '%' || p.id || '%'
      WHERE e.session_id = ? AND e.event_type = 'property_view'
    `).all(lead.session_id) as any[];

    res.json({ lead, events, properties });
  });

  // CRM: Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    
    const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username) as any;
    
    if (admin && bcrypt.compareSync(password, admin.password_hash)) {
      const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, role: admin.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // CRM: Recover Abandoned Lead
  app.post("/api/crm/leads/:id/recover", authenticateToken, (req: any, res) => {
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id) as any;
    if (!lead) return res.status(404).json({ error: "Not found" });
    
    // Simulate sending an email
    console.log(`[RECOVERY EMAIL] Sent to ${lead.email || 'Unknown'} for abandoned form recovery.`);
    
    // Update lead status and add a note
    db.prepare("UPDATE leads SET status = 'Recovery Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    
    const currentNotes = lead.notes ? JSON.parse(lead.notes) : [];
    currentNotes.push({ text: `Recovery email sent by ${req.user.username}`, date: new Date().toISOString() });
    
    db.prepare("UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(JSON.stringify(currentNotes), req.params.id);
    
    // Trigger notification
    db.prepare("INSERT INTO notifications (message, type) VALUES (?, ?)")
      .run(`Recovery email sent to "${lead.name || 'Unknown'}" by ${req.user.username}`, 'info');

    res.json({ success: true, notes: currentNotes });
  });

  // CRM: Add Note to Lead
  app.post("/api/crm/leads/:id/notes", authenticateToken, (req, res) => {
    const { note } = req.body;
    const lead = db.prepare("SELECT notes FROM leads WHERE id = ?").get(req.params.id) as any;
    if (!lead) return res.status(404).json({ error: "Not found" });
    
    const currentNotes = lead.notes ? JSON.parse(lead.notes) : [];
    currentNotes.push({ text: note, date: new Date().toISOString() });
    
    db.prepare("UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(JSON.stringify(currentNotes), req.params.id);
      
    res.json({ success: true, notes: currentNotes });
  });

  // --- ADMIN MANAGEMENT (Super Admin Only) ---
  app.get("/api/crm/admins", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'Super Admin') return res.sendStatus(403);
    const admins = db.prepare("SELECT id, username, role FROM admins").all();
    res.json(admins);
  });

  app.post("/api/crm/admins", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'Super Admin') return res.sendStatus(403);
    const { username, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
      db.prepare("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)")
        .run(username, hash, role);
      res.sendStatus(201);
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/crm/admins/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'Super Admin') return res.sendStatus(403);
    db.prepare("DELETE FROM admins WHERE id = ?").run(req.params.id);
    res.sendStatus(204);
  });

  // --- ANALYTICS & NOTIFICATIONS ---
  app.get("/api/crm/lead-trends", authenticateToken, (req: any, res) => {
    const trends = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM leads 
      GROUP BY date(created_at) 
      ORDER BY date ASC 
      LIMIT 30
    `).all();
    res.json(trends);
  });

  app.get("/api/crm/notifications", authenticateToken, (req: any, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all();
    res.json(notifications);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Recommendations based on session history
  app.get("/api/recommendations", (req, res) => {
    const { sessionId } = req.query;
    if (!sessionId) return res.json([]);

    // Get viewed properties
    const viewedEvents = db.prepare("SELECT page FROM events WHERE session_id = ? AND page LIKE '/property/%'").all(sessionId) as { page: string }[];
    const viewedIds = viewedEvents.map(e => e.page.split('/').pop()).filter(id => id && !isNaN(Number(id)));

    if (viewedIds.length === 0) {
      // Return featured properties if no history
      const featured = db.prepare("SELECT * FROM properties WHERE featured = 1 LIMIT 3").all();
      return res.json(featured);
    }

    // Get details of viewed properties to find preferences
    const placeholders = viewedIds.map(() => '?').join(',');
    const viewedProps = db.prepare(`SELECT type, location FROM properties WHERE id IN (${placeholders})`).all(...viewedIds) as { type: string, location: string }[];

    const types = [...new Set(viewedProps.map(p => p.type))];
    const locations = [...new Set(viewedProps.map(p => p.location))];

    // Find similar properties not yet viewed
    const typePlaceholders = types.map(() => '?').join(',');
    const locPlaceholders = locations.map(() => '?').join(',');
    const idPlaceholders = viewedIds.map(() => '?').join(',');

    const recommendations = db.prepare(`
      SELECT * FROM properties 
      WHERE (type IN (${typePlaceholders}) OR location IN (${locPlaceholders}))
      AND id NOT IN (${idPlaceholders})
      LIMIT 4
    `).all(...types, ...locations, ...viewedIds);

    res.json(recommendations);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
