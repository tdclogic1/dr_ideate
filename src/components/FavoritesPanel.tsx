import { useFavorites } from "../data/ideate";
import { IdeaCard } from "./IdeaCard";

export function FavoritesPanel() {
  const favorites = useFavorites();
  return (
    <section aria-labelledby="fav-h">
      <h2 id="fav-h">Favorites</h2>
      {favorites === undefined ? (
        <p className="ideate-muted">Loading…</p>
      ) : favorites.length === 0 ? (
        <p className="ideate-empty">Nothing starred yet. Star an idea on the Ideas tab and it will wait here, with room for a note.</p>
      ) : (
        <div className="ideate-grid">
          {favorites.map((i) => (
            <IdeaCard key={i._id} idea={i} showNote />
          ))}
        </div>
      )}
    </section>
  );
}
