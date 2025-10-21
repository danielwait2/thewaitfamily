import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api";

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get(`/recipes/${id}`);
        setRecipe(data);
      } catch (err) {
        setError("This recipe could not be found.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <section className="recipe-detail">
        <p className="status">Loading recipe...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recipe-detail">
        <p className="status error">{error}</p>
        <Link className="button ghost" to="/recipes">
          Back to recipes
        </Link>
      </section>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <section className="recipe-detail">
      <Link className="back-link" to="/recipes">
        &larr; Back to recipes
      </Link>
      <div className="detail-header">
        <div className="detail-text">
          <h1>{recipe.title}</h1>
          <p className="detail-description">{recipe.description}</p>
          <div className="detail-meta">
            {recipe.cookTime && (
              <span>
                <strong>Cook time:</strong> {recipe.cookTime}
              </span>
            )}
            {recipe.servings && (
              <span>
                <strong>Servings:</strong> {recipe.servings}
              </span>
            )}
          </div>
        </div>
        {recipe.imageUrl && (
          <div className="detail-image">
            <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
          </div>
        )}
      </div>
      <div className="detail-columns">
        <div>
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((item, index) => (
              <li key={item + index}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Instructions</h2>
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={step + index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default RecipeDetailPage;
