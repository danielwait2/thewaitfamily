import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => (
  <div className="home-page">
    <section className="hero home-hero">
      <div className="hero-content">
        <span className="tagline">The Wait Family hub</span>
        <h1>Celebrate the stories, recipes, and traditions that bring us together</h1>
        <p>
          From treasured Sunday sauces to bedtime tales passed down for generations, this is where
          the Wait family keeps our history alive. Explore our favorite dishes, submit your own, and
          hear firsthand memories from the people who made them.
        </p>
        <div className="hero-actions">
          <Link className="button primary" to="/recipes">
            Browse the cookbook
          </Link>
          <Link className="button ghost" to="/family-stories">
            Watch family stories
          </Link>
        </div>
      </div>
    </section>

    <section className="home-highlights">
      <header className="section-header">
        <h2>What you&apos;ll find inside</h2>
        <p>Everything you need to cook, reminisce, and stay connected as a family.</p>
      </header>
      <div className="highlight-grid">
        <article className="highlight-card">
          <div className="highlight-icon" aria-hidden="true">
            🍲
          </div>
          <h3>Family recipe library</h3>
          <p>
            Discover tested-and-true meals from every branch of the family tree. Step-by-step
            instructions make it easy for new cooks to follow along.
          </p>
          <Link className="link-button" to="/recipes">
            Explore recipes
          </Link>
        </article>
        <article className="highlight-card">
          <div className="highlight-icon" aria-hidden="true">
            🎥
          </div>
          <h3>Family history stories</h3>
          <p>
            Hear the voices of parents, grandparents, and cousins as they share the memories that
            shaped who we are today.
          </p>
          <Link className="link-button" to="/family-stories">
            Watch stories
          </Link>
        </article>
        <article className="highlight-card">
          <div className="highlight-icon" aria-hidden="true">
            📝
          </div>
          <h3>Share your signature dish</h3>
          <p>
            Submit your recipe with the story behind it. The family admin team will polish it up and
            publish it for everyone to enjoy.
          </p>
          <Link className="link-button" to="/recipes/submit">
            Submit a recipe
          </Link>
        </article>
      </div>
    </section>

    <section className="home-cta">
      <div className="cta-card">
        <h2>Let&apos;s keep building our legacy</h2>
        <p>
          Add new recipes, record another story, or simply revisit your favorites. Every contribution
          keeps the Wait spirit thriving for the next generation.
        </p>
        <div className="hero-actions">
          <Link className="button primary" to="/recipes/submit">
            Share a recipe
          </Link>
          <Link className="button ghost" to="/admin">
            Admin sign in
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default HomePage;
