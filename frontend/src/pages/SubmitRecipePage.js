import React, { useState } from "react";
import apiClient from "../api";

const initialFormState = {
  submitterName: "",
  submitterEmail: "",
  submitterNotes: "",
  title: "",
  description: "",
  cookTime: "",
  servings: "",
  ingredients: "",
  instructions: "",
  imageUrl: "",
};

const splitLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const SubmitRecipePage = () => {
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    setError("");

    const payload = {
      submitterName: form.submitterName,
      submitterEmail: form.submitterEmail,
      submitterNotes: form.submitterNotes,
      title: form.title,
      description: form.description,
      cookTime: form.cookTime,
      servings: form.servings,
      ingredients: splitLines(form.ingredients),
      instructions: splitLines(form.instructions),
      imageUrl: form.imageUrl,
    };

    try {
      await apiClient.post("/recipes/submit", payload);
      setStatus(
        "Thank you! Your recipe is waiting for review. We'll send you a note when it goes live."
      );
      setForm(initialFormState);
    } catch (err) {
      const message =
        err.response?.data?.errors?.join(" ") ||
        err.response?.data?.message ||
        "We couldn't submit your recipe. Please check the required fields.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="submit-section">
      <div className="submit-intro">
        <span className="tagline">Share your family favorite</span>
        <h1>Add your recipe to the Wait family cookbook</h1>
        <p>
          Have a dish that's a must at family gatherings? Send it our way! We'll review every
          submission, polish it up, and publish it once it's ready for the whole family to enjoy.
        </p>
      </div>

      <div className="submit-form-wrapper">
        <form onSubmit={handleSubmit} className="submit-form">
          <h2>Recipe details</h2>

          <div className="form-row">
            <label>
              Your name
              <input
                type="text"
                name="submitterName"
                value={form.submitterName}
                onChange={handleChange}
                placeholder="Optional"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="submitterEmail"
                value={form.submitterEmail}
                onChange={handleChange}
                placeholder="Optional, so we can follow up"
              />
            </label>
          </div>

          <label>
            Story or notes
            <input
              type="text"
              name="submitterNotes"
              value={form.submitterNotes}
              onChange={handleChange}
              placeholder="Tell us why this recipe matters"
            />
          </label>

          <label>
            Recipe title*
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
                placeholder="e.g., 1 hour"
              />
            </label>
            <label>
              Servings
              <input
                type="text"
                name="servings"
                value={form.servings}
                onChange={handleChange}
                placeholder="e.g., serves 6"
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
              placeholder="Optional photo link"
            />
          </label>

          {status && <p className="status success">{status}</p>}
          {error && <p className="status error">{error}</p>}

          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit my recipe"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default SubmitRecipePage;
