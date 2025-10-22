const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const mysqlBaseConfig = {
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "pass123",
};

const databaseName = process.env.DB_NAME || "appdb";
const adminUsername = process.env.ADMIN_USERNAME || "family-admin";
const adminPassword = process.env.ADMIN_PASSWORD || "wait-family-secret";
const jwtSecret = process.env.JWT_SECRET || "change-me-in-production";
const jwtExpiry = process.env.JWT_EXPIRY || "12h";

let pool = null;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createToken = () => jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: jwtExpiry });

const extractTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (_error) {
    return null;
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized." });
  }
  req.user = payload;
  return next();
};

const isAdminRequest = (req) => {
  if (req.user && req.user.role === "admin") {
    return true;
  }
  const token = extractTokenFromRequest(req);
  if (!token) {
    return false;
  }
  const payload = verifyToken(token);
  if (payload && payload.role === "admin") {
    req.user = payload;
    return true;
  }
  return false;
};

const seedRecipes = [
  {
    title: "Slow-Simmered Sunday Sauce",
    description:
      "Rich tomato sauce loaded with tender meatballs and Italian sausage. Perfect ladled over pasta for big family dinners.",
    cook_time: "2 hrs",
    servings: "6-8",
    image_url:
      "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=80",
    ingredients: [
      "2 tbsp olive oil",
      "1 yellow onion, diced",
      "3 cloves garlic, minced",
      "1 lb Italian sausage",
      "1 lb ground beef",
      "2 cans (28 oz) crushed tomatoes",
      "1 cup beef broth",
      "2 tbsp tomato paste",
      "1 tsp dried oregano",
      "1/2 tsp red pepper flakes",
      "Salt and black pepper to taste",
      "Fresh basil for serving",
    ],
    instructions: [
      "Warm olive oil over medium heat and sauté onion until translucent.",
      "Add garlic, sausage, and ground beef; cook until browned.",
      "Stir in tomatoes, broth, tomato paste, and seasonings.",
      "Simmer uncovered for 90 minutes, stirring occasionally.",
      "Season to taste and finish with fresh basil.",
    ],
  },
  {
    title: "Skillet Herb Roast Chicken",
    description:
      "One-pan roasted chicken with golden potatoes, carrots, and a garlicky herb butter drizzle.",
    cook_time: "1 hr 15 mins",
    servings: "4",
    image_url:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    ingredients: [
      "1 whole chicken (3 1/2 - 4 lbs)",
      "4 tbsp butter, softened",
      "4 cloves garlic, minced",
      "1 lemon, zested",
      "2 tsp fresh rosemary, chopped",
      "1 tsp fresh thyme leaves",
      "1 lb baby potatoes, halved",
      "3 carrots, cut into chunks",
      "1 tbsp olive oil",
      "Salt and freshly cracked pepper",
    ],
    instructions: [
      "Preheat oven to 425 F (220 C). Pat chicken dry.",
      "Mix butter, garlic, lemon zest, rosemary, thyme, salt, and pepper.",
      "Rub herb butter under the skin and over the chicken.",
      "Toss potatoes and carrots with olive oil, salt, and pepper in a skillet.",
      "Place chicken on vegetables and roast 65 minutes, basting halfway.",
      "Rest 10 minutes before carving and serving.",
    ],
  },
  {
    title: "Fresh Garden Pesto Pasta",
    description:
      "Bright basil pesto tossed with al dente pasta, toasted pine nuts, and juicy cherry tomatoes.",
    cook_time: "30 mins",
    servings: "4",
    image_url:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80",
    ingredients: [
      "12 oz linguine or spaghetti",
      "2 cups fresh basil leaves",
      "1/3 cup toasted pine nuts",
      "2 cloves garlic",
      "1/2 cup freshly grated Parmesan",
      "1/2 cup extra-virgin olive oil",
      "1 cup cherry tomatoes, halved",
      "Salt and pepper",
      "Squeeze of lemon juice",
    ],
    instructions: [
      "Cook pasta in salted water until al dente; reserve 1/2 cup pasta water.",
      "Blend basil, pine nuts, garlic, and Parmesan while drizzling in olive oil.",
      "Season pesto with salt, pepper, and lemon juice.",
      "Toss cooked pasta with pesto, loosening with reserved water as needed.",
      "Fold in cherry tomatoes and serve immediately.",
    ],
  },
];

const seedFamilyStories = [
  {
    title: "Grandpa Harold's Holiday Memories",
    description:
      "Gather round as Grandpa Harold shares how the Wait family kept traditions alive during winters on the farm.",
    video_url: "https://www.youtube.com/watch?v=2e-yRb6C8EY",
    status: "published",
  },
  {
    title: "Aunt Marie's First Big Bake",
    description:
      "Aunt Marie tells the story of learning to bake for the whole neighborhood and the pie that almost didn't make it.",
    video_url: "https://www.youtube.com/watch?v=K8s3nZPOJKM",
    status: "published",
  },
];

const formatMultilineField = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const collapseMultilineField = (value) => {
  if (!value) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean).join("\n");
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }
  return "";
};

const mapRecipeRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  cookTime: row.cook_time,
  servings: row.servings,
  imageUrl: row.image_url,
  ingredients: formatMultilineField(row.ingredients),
  instructions: formatMultilineField(row.instructions),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: row.status,
  submitterName: row.submitted_by_name || "",
  submitterEmail: row.submitted_by_email || "",
  submitterNotes: row.submitted_notes || "",
});

const mapFamilyStoryRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description || "",
  videoUrl: row.video_url,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const ensureColumnExists = async (connection, tableName, columnName, definition) => {
  const [columns] = await connection.query(
    `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
    [columnName]
  );
  if (!columns.length) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  }
};

const recipeStatuses = new Set(["pending", "approved", "rejected"]);
const storyStatuses = new Set(["draft", "published"]);

const normalizeRecipeStatus = (status, fallback) => {
  if (!status) {
    return fallback;
  }
  const normalized = String(status).toLowerCase();
  return recipeStatuses.has(normalized) ? normalized : fallback;
};

const normalizeStoryStatus = (status, fallback) => {
  if (!status) {
    return fallback;
  }
  const normalized = String(status).toLowerCase();
  return storyStatuses.has(normalized) ? normalized : fallback;
};

const ensureDatabase = async () => {
  if (pool) {
    return;
  }

  const { host, port, user, password } = mysqlBaseConfig;
  const maxRetries = parseInt(process.env.DB_RETRY_ATTEMPTS || "10", 10);
  const retryDelay = parseInt(process.env.DB_RETRY_DELAY_MS || "2000", 10);

  let attempt = 0;
  let baseConnection = null;

  while (attempt < maxRetries) {
    attempt += 1;
    try {
      baseConnection = await mysql.createConnection({
        host,
        port,
        user,
        password,
      });
      break;
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      console.warn(
        `Database connection failed (attempt ${attempt}/${maxRetries}): ${
          error.code || error.message
        }. Retrying in ${retryDelay} ms.`
      );
      await wait(retryDelay);
    }
  }

  await baseConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await baseConnection.end();

  pool = mysql.createPool({
    ...mysqlBaseConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    database: databaseName,
  });

  const connection = await pool.getConnection();

  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS recipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cook_time VARCHAR(50),
      servings VARCHAR(50),
      ingredients TEXT,
      instructions LONGTEXT,
      image_url TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      submitted_by_name VARCHAR(255),
      submitted_by_email VARCHAR(255),
      submitted_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await ensureColumnExists(
      connection,
      "recipes",
      "status",
      "status VARCHAR(20) NOT NULL DEFAULT 'pending'"
    );
    await ensureColumnExists(
      connection,
      "recipes",
      "submitted_by_name",
      "submitted_by_name VARCHAR(255)"
    );
    await ensureColumnExists(
      connection,
      "recipes",
      "submitted_by_email",
      "submitted_by_email VARCHAR(255)"
    );
    await ensureColumnExists(
      connection,
      "recipes",
      "submitted_notes",
      "submitted_notes TEXT"
    );

    await connection.query(
      "UPDATE recipes SET status = 'approved' WHERE status IS NULL OR status = ''"
    );

    const [rows] = await connection.query("SELECT COUNT(*) AS count FROM recipes");

    if (rows[0].count === 0) {
      for (const recipe of seedRecipes) {
        await connection.query(
          `INSERT INTO recipes (title, description, cook_time, servings, ingredients, instructions, image_url, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recipe.title,
            recipe.description,
            recipe.cook_time,
            recipe.servings,
            collapseMultilineField(recipe.ingredients),
            collapseMultilineField(recipe.instructions),
            recipe.image_url,
            "approved",
          ]
        );
      }
      console.log("Seeded recipes table with starter data.");
    }

    await connection.query(`CREATE TABLE IF NOT EXISTS family_stories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await ensureColumnExists(
      connection,
      "family_stories",
      "status",
      "status VARCHAR(20) NOT NULL DEFAULT 'draft'"
    );

    await connection.query(
      "UPDATE family_stories SET status = 'published' WHERE status IS NULL OR status = ''"
    );

    const [storyCountRows] = await connection.query(
      "SELECT COUNT(*) AS count FROM family_stories"
    );

    if (storyCountRows[0].count === 0) {
      for (const story of seedFamilyStories) {
        await connection.query(
          `INSERT INTO family_stories (title, description, video_url, status)
           VALUES (?, ?, ?, ?)`,
          [story.title, story.description, story.video_url, story.status]
        );
      }
      console.log("Seeded family_stories table with starter data.");
    }
  } finally {
    connection.release();
  }
};

const validateRecipePayload = (payload) => {
  const errors = [];
  if (!payload.title || !payload.title.trim()) {
    errors.push("Title is required.");
  }
  if (!payload.description || !payload.description.trim()) {
    errors.push("Description is required.");
  }
  return errors;
};

const validateFamilyStoryPayload = (payload) => {
  const errors = [];
  if (!payload.title || !payload.title.trim()) {
    errors.push("Title is required.");
  }
  if (!payload.videoUrl || !payload.videoUrl.trim()) {
    errors.push("A YouTube link is required.");
  }
  return errors;
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(422).json({ message: "Username and password are required." });
  }

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = createToken();
  res.json({ token });
});

app.get("/api/recipes", async (req, res) => {
  try {
    const adminView = isAdminRequest(req) && req.query.scope === "all";
    const sql = adminView
      ? "SELECT * FROM recipes ORDER BY created_at DESC"
      : "SELECT * FROM recipes WHERE status = 'approved' ORDER BY created_at DESC";
    const [rows] = await pool.query(sql);
    res.json(rows.map(mapRecipeRow));
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Failed to fetch recipes." });
  }
});

app.get("/api/recipes/:id", async (req, res) => {
  try {
    const adminView = isAdminRequest(req);
    const [rows] = await pool.query(
      adminView
        ? "SELECT * FROM recipes WHERE id = ?"
        : "SELECT * FROM recipes WHERE id = ? AND status = 'approved'",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json(mapRecipeRow(rows[0]));
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: "Failed to fetch recipe." });
  }
});

app.post("/api/recipes/submit", async (req, res) => {
  const errors = validateRecipePayload(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }

  const {
    title,
    description,
    cookTime = "",
    servings = "",
    ingredients = [],
    instructions = [],
    imageUrl = "",
    submitterName = "",
    submitterEmail = "",
    submitterNotes = "",
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO recipes
        (title, description, cook_time, servings, ingredients, instructions, image_url, status, submitted_by_name, submitted_by_email, submitted_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        cookTime.trim(),
        servings.trim(),
        collapseMultilineField(ingredients),
        collapseMultilineField(instructions),
        imageUrl.trim(),
        submitterName.trim(),
        submitterEmail.trim(),
        submitterNotes.trim(),
      ]
    );

    const [rows] = await pool.query("SELECT * FROM recipes WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(mapRecipeRow(rows[0]));
  } catch (error) {
    console.error("Error submitting recipe:", error);
    res.status(500).json({ message: "Failed to submit recipe." });
  }
});

app.get("/api/admin/recipes", authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = "SELECT * FROM recipes";
    const params = [];
    if (status && recipeStatuses.has(status)) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(mapRecipeRow));
  } catch (error) {
    console.error("Error fetching admin recipes:", error);
    res.status(500).json({ message: "Failed to fetch recipes." });
  }
});

app.post("/api/recipes", authenticateAdmin, async (req, res) => {
  const errors = validateRecipePayload(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }

  const {
    title,
    description,
    cookTime = "",
    servings = "",
    ingredients = [],
    instructions = [],
    imageUrl = "",
    status,
    submitterName = "",
    submitterEmail = "",
    submitterNotes = "",
  } = req.body;

  const normalizedStatus = normalizeRecipeStatus(status, "approved");

  try {
    const [result] = await pool.query(
      `INSERT INTO recipes
        (title, description, cook_time, servings, ingredients, instructions, image_url, status, submitted_by_name, submitted_by_email, submitted_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        cookTime.trim(),
        servings.trim(),
        collapseMultilineField(ingredients),
        collapseMultilineField(instructions),
        imageUrl.trim(),
        normalizedStatus,
        submitterName.trim(),
        submitterEmail.trim(),
        submitterNotes.trim(),
      ]
    );

    const [rows] = await pool.query("SELECT * FROM recipes WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(mapRecipeRow(rows[0]));
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: "Failed to create recipe." });
  }
});

app.put("/api/recipes/:id", authenticateAdmin, async (req, res) => {
  const errors = validateRecipePayload(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }

  const {
    title,
    description,
    cookTime = "",
    servings = "",
    ingredients = [],
    instructions = [],
    imageUrl = "",
    status,
    submitterName = "",
    submitterEmail = "",
    submitterNotes = "",
  } = req.body;

  const normalizedStatus = normalizeRecipeStatus(status, "pending");

  try {
    const [result] = await pool.query(
      `UPDATE recipes
       SET title = ?, description = ?, cook_time = ?, servings = ?, ingredients = ?, instructions = ?, image_url = ?, status = ?, submitted_by_name = ?, submitted_by_email = ?, submitted_notes = ?
       WHERE id = ?`,
      [
        title.trim(),
        description.trim(),
        cookTime.trim(),
        servings.trim(),
        collapseMultilineField(ingredients),
        collapseMultilineField(instructions),
        imageUrl.trim(),
        normalizedStatus,
        submitterName.trim(),
        submitterEmail.trim(),
        submitterNotes.trim(),
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const [rows] = await pool.query("SELECT * FROM recipes WHERE id = ?", [
      req.params.id,
    ]);

    res.json(mapRecipeRow(rows[0]));
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ message: "Failed to update recipe." });
  }
});

app.patch("/api/recipes/:id/status", authenticateAdmin, async (req, res) => {
  const normalizedStatus = normalizeRecipeStatus(req.body.status, null);
  if (!normalizedStatus) {
    return res.status(422).json({ message: "Invalid status." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE recipes SET status = ? WHERE id = ?",
      [normalizedStatus, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const [rows] = await pool.query("SELECT * FROM recipes WHERE id = ?", [
      req.params.id,
    ]);

    res.json(mapRecipeRow(rows[0]));
  } catch (error) {
    console.error("Error updating recipe status:", error);
    res.status(500).json({ message: "Failed to update recipe status." });
  }
});

app.delete("/api/recipes/:id", authenticateAdmin, async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM recipes WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ message: "Failed to delete recipe." });
  }
});

app.get("/api/family-stories", async (req, res) => {
  try {
    const adminView = isAdminRequest(req) && req.query.scope === "all";
    const sql = adminView
      ? "SELECT * FROM family_stories ORDER BY created_at DESC"
      : "SELECT * FROM family_stories WHERE status = 'published' ORDER BY created_at DESC";
    const [rows] = await pool.query(sql);
    res.json(rows.map(mapFamilyStoryRow));
  } catch (error) {
    console.error("Error fetching family stories:", error);
    res.status(500).json({ message: "Failed to fetch family stories." });
  }
});

app.get("/api/family-stories/:id", async (req, res) => {
  try {
    const adminView = isAdminRequest(req);
    const [rows] = await pool.query(
      adminView
        ? "SELECT * FROM family_stories WHERE id = ?"
        : "SELECT * FROM family_stories WHERE id = ? AND status = 'published'",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Story not found." });
    }

    res.json(mapFamilyStoryRow(rows[0]));
  } catch (error) {
    console.error("Error fetching family story:", error);
    res.status(500).json({ message: "Failed to fetch family story." });
  }
});

app.get("/api/admin/family-stories", authenticateAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM family_stories ORDER BY created_at DESC"
    );
    res.json(rows.map(mapFamilyStoryRow));
  } catch (error) {
    console.error("Error fetching family stories:", error);
    res.status(500).json({ message: "Failed to fetch family stories." });
  }
});

app.post("/api/family-stories", authenticateAdmin, async (req, res) => {
  const errors = validateFamilyStoryPayload(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }

  const { title, description = "", videoUrl, status } = req.body;
  const normalizedStatus = normalizeStoryStatus(status, "published");

  try {
    const [result] = await pool.query(
      `INSERT INTO family_stories (title, description, video_url, status)
       VALUES (?, ?, ?, ?)`,
      [title.trim(), description.trim(), videoUrl.trim(), normalizedStatus]
    );

    const [rows] = await pool.query("SELECT * FROM family_stories WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(mapFamilyStoryRow(rows[0]));
  } catch (error) {
    console.error("Error creating family story:", error);
    res.status(500).json({ message: "Failed to create family story." });
  }
});

app.put("/api/family-stories/:id", authenticateAdmin, async (req, res) => {
  const errors = validateFamilyStoryPayload(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }

  const { title, description = "", videoUrl, status } = req.body;
  const normalizedStatus = normalizeStoryStatus(status, "draft");

  try {
    const [result] = await pool.query(
      `UPDATE family_stories
       SET title = ?, description = ?, video_url = ?, status = ?
       WHERE id = ?`,
      [title.trim(), description.trim(), videoUrl.trim(), normalizedStatus, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Story not found." });
    }

    const [rows] = await pool.query("SELECT * FROM family_stories WHERE id = ?", [
      req.params.id,
    ]);

    res.json(mapFamilyStoryRow(rows[0]));
  } catch (error) {
    console.error("Error updating family story:", error);
    res.status(500).json({ message: "Failed to update family story." });
  }
});

app.patch("/api/family-stories/:id/status", authenticateAdmin, async (req, res) => {
  const normalizedStatus = normalizeStoryStatus(req.body.status, null);
  if (!normalizedStatus) {
    return res.status(422).json({ message: "Invalid status." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE family_stories SET status = ? WHERE id = ?",
      [normalizedStatus, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Story not found." });
    }

    const [rows] = await pool.query("SELECT * FROM family_stories WHERE id = ?", [
      req.params.id,
    ]);

    res.json(mapFamilyStoryRow(rows[0]));
  } catch (error) {
    console.error("Error updating family story status:", error);
    res.status(500).json({ message: "Failed to update family story status." });
  }
});

app.delete("/api/family-stories/:id", authenticateAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM family_stories WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Story not found." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting family story:", error);
    res.status(500).json({ message: "Failed to delete family story." });
  }
});

const startServer = async () => {
  try {
    await ensureDatabase();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    process.exit(1);
  }
};

startServer();
