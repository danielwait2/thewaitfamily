import React from "react";
import "./GiftListPage.css";

const siblings = [
  {
    name: "Daniel",
    assignedTo: "Claudia",
  },
  {
    name: "Claudia",
    assignedTo: "Miles",
  },
  {
    name: "Miles",
    assignedTo: "Samuel",
  },
  {
    name: "Samuel",
    assignedTo: "Olivia",
  },
  {
    name: "Olivia",
    assignedTo: "Kaylea",
  },
  {
    name: "Kaylea",
    assignedTo: "Daniel",
  },
];

const SiblingsGiftList2025Page = () => {
  return (
    <div className="gift-list-page">
      <header className="gift-list-header">
        <h1>Wait Siblings & In-Laws Gift Exchange</h1>
        <p>
          Christmas 2025 exchange guidelines: every sibling or in-law gifts their assigned person
          something thoughtful under $30. Keep the actual surprise under wraps, but feel free to
          coordinate shipping or timing.
        </p>
      </header>

      <section className="gift-assignments">
        <h2>Gift Exchange Assignments</h2>
        <p className="gift-assignments-note">
          Follow the circle below&mdash;each person buys for the next name, with the last looping
          back to the first. No gifting within the married pairs, and keep your final gift idea
          hush-hush!
        </p>
        <div className="assignments-grid">
          {siblings.map((sibling) => (
            <div key={sibling.name} className="assignment-card">
              <span className="assignment-giver">{sibling.name}</span>
              <span className="assignment-arrow" aria-hidden="true">
                ➜
              </span>
              <span className="assignment-receiver">{sibling.assignedTo}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="gift-list-section">
        {siblings.map((sibling) => (
          <article key={sibling.name} className="gift-card">
            <h2>{sibling.name}</h2>
            <p>
              Touch base with the family text thread if you need ideas. Keep the real gift choice a
              surprise for the big reveal!
            </p>
          </article>
        ))}
      </section>

      <footer className="gift-list-footer">
        <p>Updated for Christmas 2025 &bull; Coordinate with the family thread before purchasing!</p>
      </footer>
    </div>
  );
};

export default SiblingsGiftList2025Page;
