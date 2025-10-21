const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

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

let pool = null;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
});

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    const [rows] = await connection.query(
      "SELECT COUNT(*) AS count FROM recipes"
    );

    if (rows[0].count === 0) {
      for (const recipe of seedRecipes) {
        await connection.query(
          `INSERT INTO recipes (title, description, cook_time, servings, ingredients, instructions, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            recipe.title,
            recipe.description,
            recipe.cook_time,
            recipe.servings,
            collapseMultilineField(recipe.ingredients),
            collapseMultilineField(recipe.instructions),
            recipe.image_url,
          ]
        );
      }
      console.log("Seeded recipes table with starter data.");
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/recipes", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM recipes ORDER BY created_at DESC"
    );
    res.json(rows.map(mapRecipeRow));
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Failed to fetch recipes." });
  }
});

app.get("/api/recipes/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM recipes WHERE id = ?", [
      req.params.id,
    ]);

    if (!rows.length) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json(mapRecipeRow(rows[0]));
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: "Failed to fetch recipe." });
  }
});

app.post("/api/recipes", async (req, res) => {
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
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO recipes (title, description, cook_time, servings, ingredients, instructions, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        cookTime.trim(),
        servings.trim(),
        collapseMultilineField(ingredients),
        collapseMultilineField(instructions),
        imageUrl.trim(),
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

app.put("/api/recipes/:id", async (req, res) => {
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
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE recipes
       SET title = ?, description = ?, cook_time = ?, servings = ?, ingredients = ?, instructions = ?, image_url = ?
       WHERE id = ?`,
      [
        title.trim(),
        description.trim(),
        cookTime.trim(),
        servings.trim(),
        collapseMultilineField(ingredients),
        collapseMultilineField(instructions),
        imageUrl.trim(),
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

app.delete("/api/recipes/:id", async (req, res) => {
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
