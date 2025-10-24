import React from "react";
import { NavLink, Link } from "react-router-dom";

const Header = () => (
  <header className="site-header">
    <div className="header-inner">
      <Link to="/" className="brand">
        The Wait Family
      </Link>
      <nav className="nav-links">
        <NavLink to="/family-stories" className={({ isActive }) => (isActive ? "active" : "")}>
          Family stories
        </NavLink>
        <NavLink to="/recipes" className={({ isActive }) => (isActive ? "active" : "")}>
          Recipes
        </NavLink>
        <div className="nav-dropdown">
          <button type="button" className="nav-dropdown-toggle">
            Siblings
            <span aria-hidden="true">▾</span>
          </button>
          <div className="nav-dropdown-menu">
            <NavLink
              to="/siblings/christmas/giftlist/2025"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Christmas Gift List 2025
            </NavLink>
          </div>
        </div>
        <NavLink
          to="/recipes/submit"
          className={({ isActive }) => `cta-link ${isActive ? "active" : ""}`}
        >
          Submit a recipe
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
          Admin
        </NavLink>
      </nav>
    </div>
  </header>
);

export default Header;
