CREATE DATABASE IF NOT EXISTS appdb;

-- Use the appdb database
USE appdb;

-- Create the recipes table
CREATE TABLE IF NOT EXISTS `appdb`.`recipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `cook_time` VARCHAR(50),
  `servings` VARCHAR(50),
  `ingredients` TEXT,
  `instructions` LONGTEXT,
  `image_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Seed starter recipes
INSERT INTO `appdb`.`recipes` (`title`, `description`, `cook_time`, `servings`, `ingredients`, `instructions`, `image_url`)
SELECT * FROM (
  SELECT
    'Slow-Simmered Sunday Sauce' AS title,
    'Rich tomato sauce loaded with tender meatballs and Italian sausage. Perfect ladled over pasta for big family dinners.' AS description,
    '2 hrs' AS cook_time,
    '6-8' AS servings,
    '2 tbsp olive oil\n1 yellow onion, diced\n3 cloves garlic, minced\n1 lb Italian sausage\n1 lb ground beef\n2 cans (28 oz) crushed tomatoes\n1 cup beef broth\n2 tbsp tomato paste\n1 tsp dried oregano\n1/2 tsp red pepper flakes\nSalt and black pepper to taste\nFresh basil for serving' AS ingredients,
    'Warm olive oil over medium heat and sauté onion until translucent.\nAdd garlic, sausage, and ground beef; cook until browned.\nStir in tomatoes, broth, tomato paste, and seasonings.\nSimmer uncovered for 90 minutes, stirring occasionally.\nSeason to taste and finish with fresh basil.' AS instructions,
    'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=80' AS image_url
  UNION ALL
  SELECT
    'Skillet Herb Roast Chicken',
    'One-pan roasted chicken with golden potatoes, carrots, and a garlicky herb butter drizzle.',
    '1 hr 15 mins',
    '4',
    '1 whole chicken (3 1/2 - 4 lbs)\n4 tbsp butter, softened\n4 cloves garlic, minced\n1 lemon, zested\n2 tsp fresh rosemary, chopped\n1 tsp fresh thyme leaves\n1 lb baby potatoes, halved\n3 carrots, cut into chunks\n1 tbsp olive oil\nSalt and freshly cracked pepper',
    'Preheat oven to 425 F (220 C). Pat chicken dry.\nMix butter, garlic, lemon zest, rosemary, thyme, salt, and pepper.\nRub herb butter under the skin and over the chicken.\nToss potatoes and carrots with olive oil, salt, and pepper in a skillet.\nPlace chicken on vegetables and roast 65 minutes, basting halfway.\nRest 10 minutes before carving and serving.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
  UNION ALL
  SELECT
    'Fresh Garden Pesto Pasta',
    'Bright basil pesto tossed with al dente pasta, toasted pine nuts, and juicy cherry tomatoes.',
    '30 mins',
    '4',
    '12 oz linguine or spaghetti\n2 cups fresh basil leaves\n1/3 cup toasted pine nuts\n2 cloves garlic\n1/2 cup freshly grated Parmesan\n1/2 cup extra-virgin olive oil\n1 cup cherry tomatoes, halved\nSalt and pepper\nSqueeze of lemon juice',
    'Cook pasta in salted water until al dente; reserve 1/2 cup pasta water.\nBlend basil, pine nuts, garlic, and Parmesan while drizzling in olive oil.\nSeason pesto with salt, pepper, and lemon juice.\nToss cooked pasta with pesto, loosening with reserved water as needed.\nFold in cherry tomatoes and serve immediately.',
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80'
) AS seed_data
WHERE NOT EXISTS (SELECT 1 FROM `appdb`.`recipes`);

