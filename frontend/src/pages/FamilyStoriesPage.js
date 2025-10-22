import React, { useEffect, useState } from "react";
import apiClient from "../api";

const getYouTubeEmbedUrl = (url) => {
  if (!url) {
    return "";
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (error) {
    return url;
  }
  return url;
};

const FamilyStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/family-stories");
        setStories(data);
      } catch (err) {
        setError("We couldn't load the family stories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return (
    <section className="stories-section">
      <div className="stories-hero">
        <span className="tagline">Family history archive</span>
        <h1>Stories that shaped the Wait family</h1>
        <p>
          Pour a cup of coffee, gather the family, and enjoy these treasured memories told in the
          voices of the people who lived them.
        </p>
      </div>

      {loading ? (
        <p className="status">Loading family stories...</p>
      ) : error ? (
        <p className="status error">{error}</p>
      ) : stories.length === 0 ? (
        <p className="status">No stories yet. Check back soon for new memories.</p>
      ) : (
        <div className="story-grid">
          {stories.map((story) => (
            <article key={story.id} className="story-card">
              <div className="story-video">
                <iframe
                  src={getYouTubeEmbedUrl(story.videoUrl)}
                  title={story.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="story-body">
                <h3>{story.title}</h3>
                {story.description && <p>{story.description}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default FamilyStoriesPage;
