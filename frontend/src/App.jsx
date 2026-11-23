import { useEffect, useState } from "react";
import "./App.css";

const DRINKS_API = import.meta.env.VITE_DRINKS_API_URL || "http://localhost:8001";
const FOOD_API = import.meta.env.VITE_FOOD_API_URL || "http://localhost:8002";

export default function App() {
  const [drinks, setDrinks] = useState([]);
  const [food, setFood] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("drinks");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Inline editing state
  const [editingKey, setEditingKey] = useState(null); // e.g. "drinks-3"
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const loadMenu = async () => {
    try {
      setError("");
      const [dRes, fRes] = await Promise.all([
        fetch(`${DRINKS_API}/drinks`),
        fetch(`${FOOD_API}/food`),
      ]);
      if (!dRes.ok || !fRes.ok) throw new Error("Failed to load menu");
      setDrinks(await dRes.json());
      setFood(await fRes.json());
    } catch {
      setError("Could not reach the kitchen. Make sure both APIs are running.");
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const addItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const url = category === "drinks" ? `${DRINKS_API}/drinks` : `${FOOD_API}/food`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: parseFloat(price) }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      setName("");
      setPrice("");
      await loadMenu();
    } catch {
      setError("Could not add item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (type, item) => {
    setEditingKey(`${type}-${item.id}`);
    setEditName(item.name);
    setEditPrice(String(item.price));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditName("");
    setEditPrice("");
  };

  const saveEdit = async (e, type, id) => {
    e.preventDefault();
    setError("");
    try {
      const url = type === "drinks" ? `${DRINKS_API}/drinks/${id}` : `${FOOD_API}/food/${id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), price: parseFloat(editPrice) }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      cancelEdit();
      await loadMenu();
    } catch {
      setError("Could not update item. Please try again.");
    }
  };

  const deleteItem = async (type, id) => {
    setError("");
    try {
      const url = type === "drinks" ? `${DRINKS_API}/drinks/${id}` : `${FOOD_API}/food/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      if (editingKey === `${type}-${id}`) cancelEdit();
      await loadMenu();
    } catch {
      setError("Could not delete item. Please try again.");
    }
  };

  const renderMenuList = (type, items, emptyMessage) => {
    if (items.length === 0) {
      return <p className="empty-state">{emptyMessage}</p>;
    }

    return (
      <ul className="menu-list">
        {items.map((item) => {
          const isEditing = editingKey === `${type}-${item.id}`;
          return (
            <li key={item.id} className="menu-item">
              {isEditing ? (
                <form className="edit-row" onSubmit={(e) => saveEdit(e, type, item.id)}>
                  <input
                    className="edit-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                  <input
                    className="edit-input edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                  <button type="submit" className="save-btn">Save</button>
                  <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                </form>
              ) : (
                <>
                  <span className="item-name">{item.name}</span>
                  <span className="item-dots" />
                  <span className="item-price">${Number(item.price).toFixed(2)}</span>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit"
                      onClick={() => startEdit(type, item)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="icon-btn delete-btn"
                      title="Delete"
                      onClick={() => deleteItem(type, item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <main className="cafe-page">
      <header className="cafe-header">
        <span className="cafe-badge">Freshly Brewed Daily</span>
        <h1>Roast &amp; Crumb</h1>
        <p className="cafe-subtitle">Small-batch coffee &amp; warm artisan bites</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="add-card">
        <form onSubmit={addItem} className="add-form">
          <div className="category-toggle" role="group" aria-label="Category">
            <button
              type="button"
              className={`toggle-btn ${category === "drinks" ? "active" : ""}`}
              onClick={() => setCategory("drinks")}
            >
              ☕ Drink
            </button>
            <button
              type="button"
              className={`toggle-btn ${category === "food" ? "active" : ""}`}
              onClick={() => setCategory("food")}
            >
              🥐 Food
            </button>
          </div>

          <input
            className="input-field"
            placeholder={category === "drinks" ? "e.g. Oat Milk Cortado" : "e.g. Almond Croissant"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="input-field price-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Price ($)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "+ Add to Menu"}
          </button>
        </form>
      </section>

      <div className="menu-grid">
        <section className="menu-section">
          <div className="section-header">
            <div className="section-title-group">
              <span className="section-icon">☕</span>
              <h2>Drinks</h2>
            </div>
            <span className="item-count">{drinks.length} items</span>
          </div>
          {renderMenuList("drinks", drinks, "No drinks on the board yet. Brew the first one above.")}
        </section>

        <section className="menu-section">
          <div className="section-header">
            <div className="section-title-group">
              <span className="section-icon">🥐</span>
              <h2>Food</h2>
            </div>
            <span className="item-count">{food.length} items</span>
          </div>
          {renderMenuList("food", food, "The pastry case is empty. Add a treat above.")}
        </section>
      </div>
    </main>
  );
}