import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import AdminPage from "./pages/AdminPage";
import FamilyStoriesPage from "./pages/FamilyStoriesPage";
import SubmitRecipePage from "./pages/SubmitRecipePage";
import SiblingsGiftList2025Page from "./pages/SiblingsGiftList2025Page";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Header />
        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/submit" element={<SubmitRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/recipe" element={<Navigate to="/recipes" replace />} />
            <Route path="/family-stories" element={<FamilyStoriesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="/siblings/christmas/giftlist/2025"
              element={<SiblingsGiftList2025Page />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
