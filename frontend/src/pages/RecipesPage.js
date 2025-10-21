import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/recipes");
        setRecipes(data);
      } catch (err) {
        setError("We couldn't load the recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) {
    return (
      <section className="recipes-section">
        <p className="status">Loading recipes...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recipes-section">
        <p className="status error">{error}</p>
      </section>
    );
  }

  return (
    <section className="recipes-section">
      <header className="section-header">
        <h2>Family favorites</h2>
        <p>Browse each recipe for ingredients, instructions, and cooking tips.</p>
      </header>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <article key={recipe.id} className="recipe-card">
            <Link to={`/recipes/${recipe.id}`}>
              <div className="card-image">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
                ) : (
                  <div className="image-placeholder" aria-hidden="true">
                    <span>{recipe.title?.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="card-body">
                <h3>{recipe.title}</h3>
                {recipe.cookTime || recipe.servings ? (
                  <p className="meta">
                    {recipe.cookTime && <span>{recipe.cookTime}</span>}
                    {recipe.servings && <span>{recipe.servings} servings</span>}
                  </p>
                ) : null}
                <p className="description">{recipe.description}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
      {!recipes.length && <p className="status">No recipes yet. Add one from the admin page.</p>}
    </section>
  );
};

export default RecipesPage;
