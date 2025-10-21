import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => (
  <section className="hero">
    <div className="hero-content">
      <span className="tagline">Welcome to the Wait Family table</span>
      <h1>Family-tested recipes for every gathering</h1>
      <p>
        Browse our favorite dishes, from slow-simmered sauces to weeknight staples. Each recipe
        comes with simple instructions so you can cook with confidence.
      </p>
      <div className="hero-actions">
        <Link className="button primary" to="/recipes">
          Explore recipes
        </Link>
        <Link className="button ghost" to="/admin">
          Update the cookbook
        </Link>
      </div>
    </div>
  </section>
);

export default HomePage;
