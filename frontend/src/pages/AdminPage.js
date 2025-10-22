import React, { useCallback, useEffect, useMemo, useState } from "react";
import apiClient, { getAuthToken, setAuthToken } from "../api";

const createEmptyRecipeForm = () => ({
  id: null,
  title: "",
  description: "",
  cookTime: "",
  servings: "",
  ingredients: "",
  instructions: "",
  imageUrl: "",
  status: "approved",
  submitterName: "",
  submitterEmail: "",
  submitterNotes: "",
});

const createEmptyStoryForm = () => ({
  id: null,
  title: "",
  description: "",
  videoUrl: "",
  status: "published",
});

const listToTextarea = (items) => (Array.isArray(items) ? items.join("\n") : items || "");

const splitLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const recipeStatusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const storyStatusLabels = {
  draft: "Draft",
  published: "Published",
};

const AdminPage = () => {
  const [token, setToken] = useState(() => getAuthToken() || null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const isAuthenticated = Boolean(token);

  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipeListError, setRecipeListError] = useState("");
  const [recipeForm, setRecipeForm] = useState(createEmptyRecipeForm());
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [recipeFeedback, setRecipeFeedback] = useState("");
  const [recipeError, setRecipeError] = useState("");

  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storyListError, setStoryListError] = useState("");
  const [storyForm, setStoryForm] = useState(createEmptyStoryForm());
  const [storySaving, setStorySaving] = useState(false);
  const [storyFeedback, setStoryFeedback] = useState("");
  const [storyError, setStoryError] = useState("");

  const pendingRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.status === "pending"),
    [recipes]
  );
  const approvedRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.status === "approved"),
    [recipes]
  );
  const rejectedRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.status === "rejected"),
    [recipes]
  );

  const publishedStories = useMemo(
    () => stories.filter((story) => story.status === "published"),
    [stories]
  );
  const draftStories = useMemo(
    () => stories.filter((story) => story.status === "draft"),
    [stories]
  );

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);
    setRecipeListError("");
    try {
      const { data } = await apiClient.get("/admin/recipes");
      setRecipes(data);
    } catch (err) {
      setRecipeListError(
        err.response?.data?.message || "Unable to load recipes. Please refresh."
      );
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const loadStories = useCallback(async () => {
    setStoriesLoading(true);
    setStoryListError("");
    try {
      const { data } = await apiClient.get("/admin/family-stories");
      setStories(data);
    } catch (err) {
      setStoryListError(
        err.response?.data?.message || "Unable to load family stories. Please refresh."
      );
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadRecipes();
    loadStories();
  }, [isAuthenticated, loadRecipes, loadStories]);

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data } = await apiClient.post("/auth/login", loginForm);
      setAuthToken(data.token);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("adminToken", data.token);
      }
      setToken(data.token);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("adminToken");
    }
    setToken(null);
    setRecipes([]);
    setStories([]);
    setRecipeForm(createEmptyRecipeForm());
    setStoryForm(createEmptyStoryForm());
  };

  const handleRecipeChange = (event) => {
    const { name, value } = event.target;
    setRecipeForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildRecipePayload = () => ({
    title: recipeForm.title,
    description: recipeForm.description,
    cookTime: recipeForm.cookTime,
    servings: recipeForm.servings,
    ingredients: splitLines(recipeForm.ingredients),
    instructions: splitLines(recipeForm.instructions),
    imageUrl: recipeForm.imageUrl,
    status: recipeForm.status,
    submitterName: recipeForm.submitterName,
    submitterEmail: recipeForm.submitterEmail,
    submitterNotes: recipeForm.submitterNotes,
  });

  const handleRecipeSubmit = async (event) => {
    event.preventDefault();
    setRecipeSaving(true);
    setRecipeFeedback("");
    setRecipeError("");
    try {
      if (recipeForm.id) {
        const { data } = await apiClient.put(`/recipes/${recipeForm.id}`, buildRecipePayload());
        setRecipes((prev) => prev.map((recipe) => (recipe.id === data.id ? data : recipe)));
        setRecipeFeedback("Recipe updated.");
      } else {
        const { data } = await apiClient.post("/recipes", buildRecipePayload());
        setRecipes((prev) => [data, ...prev]);
        setRecipeForm(createEmptyRecipeForm());
        setRecipeFeedback("Recipe added.");
      }
    } catch (err) {
      const message =
        err.response?.data?.errors?.join(" ") ||
        err.response?.data?.message ||
        "We couldn't save the recipe. Please check required fields.";
      setRecipeError(message);
    } finally {
      setRecipeSaving(false);
    }
  };

  const handleRecipeEdit = (recipe) => {
    setRecipeForm({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      cookTime: recipe.cookTime || "",
      servings: recipe.servings || "",
      ingredients: listToTextarea(recipe.ingredients),
      instructions: listToTextarea(recipe.instructions),
      imageUrl: recipe.imageUrl || "",
      status: recipe.status || "pending",
      submitterName: recipe.submitterName || "",
      submitterEmail: recipe.submitterEmail || "",
      submitterNotes: recipe.submitterNotes || "",
    });
    setRecipeFeedback("");
    setRecipeError("");
  };

  const handleRecipeDelete = async (recipeId) => {
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
      if (recipeForm.id === recipeId) {
        setRecipeForm(createEmptyRecipeForm());
      }
      setRecipeFeedback("Recipe deleted.");
    } catch (err) {
      setRecipeError("We couldn't delete the recipe. Please try again.");
    }
  };

  const handleRecipeStatusUpdate = async (recipeId, newStatus) => {
    setRecipeFeedback("");
    setRecipeError("");
    try {
      const { data } = await apiClient.patch(`/recipes/${recipeId}/status`, {
        status: newStatus,
      });
      setRecipes((prev) => prev.map((recipe) => (recipe.id === data.id ? data : recipe)));
      setRecipeFeedback(`Recipe marked as ${recipeStatusLabels[newStatus]}.`);
    } catch (err) {
      setRecipeError("We couldn't update the recipe status. Please try again.");
    }
  };

  const handleRecipeReset = () => {
    setRecipeForm(createEmptyRecipeForm());
    setRecipeFeedback("");
    setRecipeError("");
  };

  const handleStoryChange = (event) => {
    const { name, value } = event.target;
    setStoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStorySubmit = async (event) => {
    event.preventDefault();
    setStorySaving(true);
    setStoryFeedback("");
    setStoryError("");

    const payload = {
      title: storyForm.title,
      description: storyForm.description,
      videoUrl: storyForm.videoUrl,
      status: storyForm.status,
    };

    try {
      if (storyForm.id) {
        const { data } = await apiClient.put(`/family-stories/${storyForm.id}`, payload);
        setStories((prev) => prev.map((story) => (story.id === data.id ? data : story)));
        setStoryFeedback("Family story updated.");
      } else {
        const { data } = await apiClient.post("/family-stories", payload);
        setStories((prev) => [data, ...prev]);
        setStoryForm(createEmptyStoryForm());
        setStoryFeedback("Family story added.");
      }
    } catch (err) {
      const message =
        err.response?.data?.errors?.join(" ") ||
        err.response?.data?.message ||
        "We couldn't save the family story. Please check the required fields.";
      setStoryError(message);
    } finally {
      setStorySaving(false);
    }
  };

  const handleStoryEdit = (story) => {
    setStoryForm({
      id: story.id,
      title: story.title,
      description: story.description || "",
      videoUrl: story.videoUrl || "",
      status: story.status || "draft",
    });
    setStoryFeedback("");
    setStoryError("");
  };

  const handleStoryDelete = async (storyId) => {
    const story = stories.find((item) => item.id === storyId);
    const confirmed = window.confirm(
      `Delete "${story?.title || "this story"}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/family-stories/${storyId}`);
      setStories((prev) => prev.filter((item) => item.id !== storyId));
      if (storyForm.id === storyId) {
        setStoryForm(createEmptyStoryForm());
      }
      setStoryFeedback("Family story deleted.");
    } catch (err) {
      setStoryError("We couldn't delete the story. Please try again.");
    }
  };

  const handleStoryStatusUpdate = async (storyId, newStatus) => {
    setStoryFeedback("");
    setStoryError("");
    try {
      const { data } = await apiClient.patch(`/family-stories/${storyId}/status`, {
        status: newStatus,
      });
      setStories((prev) => prev.map((story) => (story.id === data.id ? data : story)));
      setStoryFeedback(`Story marked as ${storyStatusLabels[newStatus]}.`);
    } catch (err) {
      setStoryError("We couldn't update the story status. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="admin-section auth">
        <div className="admin-auth">
          <h1>Family Hub Admin</h1>
          <p>Sign in to review recipe submissions and publish family stories.</p>
          <form onSubmit={handleLoginSubmit} className="admin-auth-form">
            <label>
              Username
              <input
                type="text"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </label>
            {authError && <p className="status error">{authError}</p>}
            <button type="submit" className="button primary" disabled={authLoading}>
              {authLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <div className="admin-hero">
        <div>
          <span className="tagline">Admin dashboard</span>
          <h1>Keep the Wait family traditions thriving</h1>
          <p>
            Approve community recipe submissions, polish the cookbook, and publish new family
            stories for everyone to enjoy.
          </p>
        </div>
        <button className="button ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-module">
        <div className="module-header">
          <h2>Recipe moderation</h2>
          <p>Review submissions, update favorites, and manage recipe visibility.</p>
        </div>
        <div className="admin-grid">
          <div className="admin-form">
            <div className="form-header">
              <h3>{recipeForm.id ? "Edit recipe" : "Add a new recipe"}</h3>
              {recipeForm.id && (
                <button className="link-button" onClick={handleRecipeReset} type="button">
                  Start new
                </button>
              )}
            </div>

            <form onSubmit={handleRecipeSubmit}>
              <label>
                Title*
                <input
                  type="text"
                  name="title"
                  value={recipeForm.title}
                  onChange={handleRecipeChange}
                  required
                />
              </label>

              <label>
                Short description*
                <textarea
                  name="description"
                  value={recipeForm.description}
                  onChange={handleRecipeChange}
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
                    value={recipeForm.cookTime}
                    onChange={handleRecipeChange}
                    placeholder="e.g., 45 mins"
                  />
                </label>
                <label>
                  Servings
                  <input
                    type="text"
                    name="servings"
                    value={recipeForm.servings}
                    onChange={handleRecipeChange}
                    placeholder="e.g., 4"
                  />
                </label>
              </div>

              <label>
                Ingredients (one per line)
                <textarea
                  name="ingredients"
                  value={recipeForm.ingredients}
                  onChange={handleRecipeChange}
                  rows={6}
                />
              </label>

              <label>
                Instructions (one step per line)
                <textarea
                  name="instructions"
                  value={recipeForm.instructions}
                  onChange={handleRecipeChange}
                  rows={6}
                />
              </label>

              <label>
                Image URL
                <input
                  type="url"
                  name="imageUrl"
                  value={recipeForm.imageUrl}
                  onChange={handleRecipeChange}
                  placeholder="https://example.com/photo.jpg"
                />
              </label>

              <div className="form-row">
                <label>
                  Submission status
                  <select
                    name="status"
                    value={recipeForm.status}
                    onChange={handleRecipeChange}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label>
                  Submitter name
                  <input
                    type="text"
                    name="submitterName"
                    value={recipeForm.submitterName}
                    onChange={handleRecipeChange}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Submitter email
                  <input
                    type="email"
                    name="submitterEmail"
                    value={recipeForm.submitterEmail}
                    onChange={handleRecipeChange}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Notes from submitter
                  <input
                    type="text"
                    name="submitterNotes"
                    value={recipeForm.submitterNotes}
                    onChange={handleRecipeChange}
                    placeholder="Optional context"
                  />
                </label>
              </div>

              {recipeFeedback && <p className="status success">{recipeFeedback}</p>}
              {recipeError && <p className="status error">{recipeError}</p>}

              <button className="button primary" type="submit" disabled={recipeSaving}>
                {recipeSaving ? "Saving..." : recipeForm.id ? "Save changes" : "Add recipe"}
              </button>
            </form>
          </div>

          <div className="admin-list">
            <h3>Submissions &amp; cookbook</h3>
            {recipeListError && <p className="status error">{recipeListError}</p>}

            {recipesLoading ? (
              <p className="status">Loading recipes...</p>
            ) : (
              <>
                <div className="list-group">
                  <div className="list-group-header">
                    <h4>Pending approval</h4>
                    <span className="badge">{pendingRecipes.length}</span>
                  </div>
                  {pendingRecipes.length ? (
                    <ul>
                      {pendingRecipes.map((recipe) => (
                        <li key={recipe.id} className="pending">
                          <div>
                            <strong>{recipe.title}</strong>
                            <span>{recipe.cookTime || "Timing TBD"}</span>
                            {(recipe.submitterName || recipe.submitterEmail) && (
                              <p className="submitter">
                                Submitted by {recipe.submitterName || "Anonymous"}
                                {recipe.submitterEmail ? ` · ${recipe.submitterEmail}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="list-actions">
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleRecipeEdit(recipe)}
                            >
                              Review
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleRecipeStatusUpdate(recipe.id, "approved")}
                            >
                              Approve
                            </button>
                            <button
                              className="link-button danger"
                              type="button"
                              onClick={() => handleRecipeStatusUpdate(recipe.id, "rejected")}
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="status muted">No pending recipes right now.</p>
                  )}
                </div>

                <div className="list-group">
                  <div className="list-group-header">
                    <h4>Published recipes</h4>
                    <span className="badge">{approvedRecipes.length}</span>
                  </div>
                  {approvedRecipes.length ? (
                    <ul>
                      {approvedRecipes.map((recipe) => (
                        <li key={recipe.id}>
                          <div>
                            <strong>{recipe.title}</strong>
                            <span>{recipe.cookTime || "Timing TBD"}</span>
                          </div>
                          <div className="list-actions">
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleRecipeEdit(recipe)}
                            >
                              Edit
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleRecipeStatusUpdate(recipe.id, "pending")}
                            >
                              Mark pending
                            </button>
                            <button
                              className="link-button danger"
                              type="button"
                              onClick={() => handleRecipeDelete(recipe.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="status muted">No published recipes yet. Add one above.</p>
                  )}
                </div>

                {rejectedRecipes.length ? (
                  <div className="list-group">
                    <div className="list-group-header">
                      <h4>Rejected or archived</h4>
                      <span className="badge">{rejectedRecipes.length}</span>
                    </div>
                    <ul>
                      {rejectedRecipes.map((recipe) => (
                        <li key={recipe.id} className="rejected">
                          <div>
                            <strong>{recipe.title}</strong>
                            <span>Rejected</span>
                          </div>
                          <div className="list-actions">
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleRecipeEdit(recipe)}
                            >
                              Edit
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleRecipeStatusUpdate(recipe.id, "pending")}
                            >
                              Reopen
                            </button>
                            <button
                              className="link-button danger"
                              type="button"
                              onClick={() => handleRecipeDelete(recipe.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="admin-module">
        <div className="module-header">
          <h2>Family stories</h2>
          <p>Share cherished memories and videos that keep the Wait legacy alive.</p>
        </div>

        <div className="admin-grid">
          <div className="admin-form">
            <div className="form-header">
              <h3>{storyForm.id ? "Edit family story" : "Add a new family story"}</h3>
              {storyForm.id && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => {
                    setStoryForm(createEmptyStoryForm());
                    setStoryFeedback("");
                    setStoryError("");
                  }}
                >
                  Start new
                </button>
              )}
            </div>

            <form onSubmit={handleStorySubmit}>
              <label>
                Title*
                <input
                  type="text"
                  name="title"
                  value={storyForm.title}
                  onChange={handleStoryChange}
                  required
                />
              </label>

              <label>
                Short description
                <textarea
                  name="description"
                  value={storyForm.description}
                  onChange={handleStoryChange}
                  rows={4}
                />
              </label>

              <label>
                YouTube link*
                <input
                  type="url"
                  name="videoUrl"
                  value={storyForm.videoUrl}
                  onChange={handleStoryChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </label>

              <label>
                Status
                <select name="status" value={storyForm.status} onChange={handleStoryChange}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>

              {storyFeedback && <p className="status success">{storyFeedback}</p>}
              {storyError && <p className="status error">{storyError}</p>}

              <button className="button primary" type="submit" disabled={storySaving}>
                {storySaving ? "Saving..." : storyForm.id ? "Save changes" : "Add family story"}
              </button>
            </form>
          </div>

          <div className="admin-list">
            <h3>Stories library</h3>
            {storyListError && <p className="status error">{storyListError}</p>}

            {storiesLoading ? (
              <p className="status">Loading stories...</p>
            ) : (
              <>
                <div className="list-group">
                  <div className="list-group-header">
                    <h4>Published</h4>
                    <span className="badge">{publishedStories.length}</span>
                  </div>
                  {publishedStories.length ? (
                    <ul>
                      {publishedStories.map((story) => (
                        <li key={story.id}>
                          <div>
                            <strong>{story.title}</strong>
                            <span>{story.status === "published" ? "Live" : "Draft"}</span>
                          </div>
                          <div className="list-actions">
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleStoryEdit(story)}
                            >
                              Edit
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleStoryStatusUpdate(story.id, "draft")}
                            >
                              Unpublish
                            </button>
                            <button
                              className="link-button danger"
                              type="button"
                              onClick={() => handleStoryDelete(story.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="status muted">No stories published yet.</p>
                  )}
                </div>

                <div className="list-group">
                  <div className="list-group-header">
                    <h4>Drafts &amp; prep</h4>
                    <span className="badge">{draftStories.length}</span>
                  </div>
                  {draftStories.length ? (
                    <ul>
                      {draftStories.map((story) => (
                        <li key={story.id} className="pending">
                          <div>
                            <strong>{story.title}</strong>
                            <span>Draft</span>
                          </div>
                          <div className="list-actions">
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleStoryEdit(story)}
                            >
                              Edit
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              onClick={() => handleStoryStatusUpdate(story.id, "published")}
                            >
                              Publish
                            </button>
                            <button
                              className="link-button danger"
                              type="button"
                              onClick={() => handleStoryDelete(story.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="status muted">No drafts right now.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminPage;
