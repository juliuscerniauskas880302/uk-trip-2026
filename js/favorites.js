/**
 * Explore Three Cities — Favorites Manager
 * Persists favorited place IDs in localStorage.
 */

window.App = window.App || {};

App.Favorites = {
  STORAGE_KEY: 'explore3cities_favorites',

  /** Get all favorited place IDs as an array */
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  /** Save the full favorites array */
  _save(ids) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage may be full or disabled — silently fail
    }
  },

  /** Toggle a place's favorite status. Returns true if now favorited. */
  toggle(placeId) {
    const ids = this.getAll();
    const index = ids.indexOf(placeId);
    if (index === -1) {
      ids.push(placeId);
    } else {
      ids.splice(index, 1);
    }
    this._save(ids);
    return index === -1;
  },

  /** Check if a place is favorited */
  isFavorite(placeId) {
    return this.getAll().includes(placeId);
  },

  /** Get count of favorites */
  count() {
    return this.getAll().length;
  },
};
