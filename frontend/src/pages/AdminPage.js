import React, { useEffect, useState } from "react";
import apiClient from "../api";

const createEmptyForm = () => ({
  id: null,
  title: "",
  description: "",
  cookTime: "",
  servings: "",
  ingredients: "",
  instructions: "",
  imageUrl: "",
});

const listToTextarea = (items) => (Array.isArray(items) ? items.join("\n") : items || "");

const AdminPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/recipes");
      setRecipes(data);
    } catch (err) {
      setError("Unable to load recipes. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const resetForm = () => {
    setForm(createEmptyForm());
    setStatus("");
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    cookTime: form.cookTime,
    servings: form.servings,
    ingredients: form.ingredients.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    instructions: form.instructions.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    imageUrl: form.imageUrl,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      if (form.id) {
        const { data } = await apiClient.put(`/recipes/${form.id}`, buildPayload());
        setRecipes((prev) => prev.map((recipe) => (recipe.id === form.id ? data : recipe)));
        setStatus("Recipe updated.");
      } else {
        const { data } = await apiClient.post("/recipes", buildPayload());
        setRecipes((prev) => [data, ...prev]);
        setStatus("Recipe added.");
        setForm(createEmptyForm());
      }
    } catch (err) {
      const message =
        err.response?.data?.errors?.join(" ") ||
        err.response?.data?.message ||
        "We couldn't save the recipe. Please check required fields.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recipe) => {
    setForm({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      cookTime: recipe.cookTime || "",
      servings: recipe.servings || "",
      ingredients: listToTextarea(recipe.ingredients),
      instructions: listToTextarea(recipe.instructions),
      imageUrl: recipe.imageUrl || "",
    });
    setStatus("");
    setError("");
  };

  const handleDelete = async (recipeId) => {
    const recipe = recipes.find((item) => item.id === recipeId);
    const confirmed = window.confirm(
      `Delete "${recipe?.title || "this recipe"}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/recipes/${recipeId}`);
      setRecipes((prev) => prev.filter((item) => item.id !== recipeId));
      if (form.id === recipeId) {
        resetForm();
      } else {
        setStatus("Recipe deleted.");
      }
    } catch (err) {
      setError("We couldn't delete the recipe. Please try again.");
    }
  };

  return (
    <section className="admin-section">
      <header className="section-header">
        <h2>Recipe admin</h2>
        <p>Manage the cookbook by adding new recipes or updating family favorites.</p>
      </header>

      <div className="admin-grid">
        <div className="admin-form">
          <div className="form-header">
            <h3>{form.id ? "Edit recipe" : "Add a new recipe"}</h3>
            {form.id && (
              <button className="link-button" onClick={resetForm}>
                Start new
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <label>
              Title*
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Short description*
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                required
              />
            </label>

            <div className="form-row">
              <label>
                Cook time
                <input
                  type="text"
                  name="cookTime"
                  value={form.cookTime}
                  onChange={handleChange}
                  placeholder="e.g., 45 mins"
                />
              </label>
              <label>
                Servings
                <input
                  type="text"
                  name="servings"
                  value={form.servings}
                  onChange={handleChange}
                  placeholder="e.g., 4"
                />
              </label>
            </div>

            <label>
              Ingredients (one per line)
              <textarea
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                rows={6}
              />
            </label>

            <label>
              Instructions (one step per line)
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                rows={6}
              />
            </label>

            <label>
              Image URL
              <input
                type="url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
              />
            </label>

            {status && <p className="status success">{status}</p>}
            {error && <p className="status error">{error}</p>}

            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : form.id ? "Save changes" : "Add recipe"}
            </button>
          </form>
        </div>

        <div className="admin-list">
          <h3>Current recipes</h3>
          {loading ? (
            <p className="status">Loading recipes...</p>
          ) : (
            <ul>
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <div>
                    <strong>{recipe.title}</strong>
                    <span>{recipe.cookTime || "No cook time"}</span>
                  </div>
                  <div className="list-actions">
                    <button className="link-button" onClick={() => handleEdit(recipe)}>
                      Edit
                    </button>
                    <button className="link-button danger" onClick={() => handleDelete(recipe.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && !recipes.length && (
            <p className="status">No recipes yet. Use the form to add one.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPage;
