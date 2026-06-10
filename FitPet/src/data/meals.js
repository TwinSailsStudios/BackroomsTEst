// Meal templates with macros per single base portion.
// The generator scales portions so every card fits the user's
// remaining calorie/macro budget for the day.
const MEAL_TEMPLATES = [
  { name: 'Grilled Chicken Bowl', emoji: '🍗', calories: 520, protein: 45, carbs: 48, fat: 14, tags: ['High Protein', 'Lunch'] },
  { name: 'Salmon Teriyaki & Rice', emoji: '🍣', calories: 610, protein: 38, carbs: 62, fat: 21, tags: ['Omega-3', 'Dinner'] },
  { name: 'Protein Oats + Berries', emoji: '🥣', calories: 380, protein: 28, carbs: 52, fat: 8, tags: ['Breakfast', 'Fiber'] },
  { name: 'Turkey Avocado Wrap', emoji: '🌯', calories: 450, protein: 32, carbs: 40, fat: 17, tags: ['Quick', 'Lunch'] },
  { name: 'Greek Yogurt Parfait', emoji: '🍨', calories: 260, protein: 22, carbs: 30, fat: 6, tags: ['Snack', 'Low Cal'] },
  { name: 'Beef Burrito Bowl', emoji: '🥙', calories: 680, protein: 42, carbs: 64, fat: 26, tags: ['Bulk', 'Dinner'] },
  { name: 'Tofu Stir-Fry Noodles', emoji: '🍜', calories: 540, protein: 26, carbs: 70, fat: 16, tags: ['Vegan', 'Dinner'] },
  { name: 'Egg White Omelette', emoji: '🍳', calories: 290, protein: 30, carbs: 12, fat: 13, tags: ['Breakfast', 'Keto-ish'] },
  { name: 'Tuna Poke Bowl', emoji: '🐟', calories: 470, protein: 36, carbs: 50, fat: 12, tags: ['Fresh', 'Lunch'] },
  { name: 'Cottage Cheese & Fruit', emoji: '🍑', calories: 220, protein: 24, carbs: 22, fat: 4, tags: ['Snack', 'High Protein'] },
  { name: 'Chicken Caesar Salad', emoji: '🥗', calories: 410, protein: 38, carbs: 16, fat: 22, tags: ['Low Carb', 'Lunch'] },
  { name: 'Protein Smoothie', emoji: '🥤', calories: 310, protein: 30, carbs: 36, fat: 6, tags: ['Post-Workout'] },
  { name: 'Shrimp Tacos (x2)', emoji: '🌮', calories: 430, protein: 28, carbs: 44, fat: 15, tags: ['Dinner', 'Fresh'] },
  { name: 'Peanut Butter Rice Cakes', emoji: '🥜', calories: 240, protein: 9, carbs: 26, fat: 12, tags: ['Snack', 'Quick'] },
  { name: 'Steak & Sweet Potato', emoji: '🥩', calories: 640, protein: 48, carbs: 46, fat: 27, tags: ['Bulk', 'Dinner'] },
  { name: 'Lentil Power Soup', emoji: '🍲', calories: 340, protein: 20, carbs: 50, fat: 7, tags: ['Vegan', 'Fiber'] },
];

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);

let cardId = 0;

/**
 * Generates swipe cards that fit the remaining daily budget.
 * Portions are scaled (0.5x – 1.5x) so the calories land at or
 * under what the user has left.
 */
export function generateMealCards(remaining, count = 10) {
  const budget = Math.max(remaining.calories, 0);

  // Out of budget: only offer feather-light snacks at half portion.
  const pool =
    budget < 180
      ? MEAL_TEMPLATES.filter((m) => m.calories <= 300)
      : MEAL_TEMPLATES;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const cards = [];

  for (let i = 0; cards.length < count; i++) {
    const tpl = shuffled[i % shuffled.length];
    // Aim somewhere between a light snack and the full remaining budget.
    const target = budget > 180 ? budget * (0.35 + Math.random() * 0.65) : 150;
    let scale = target / tpl.calories;
    scale = Math.min(1.5, Math.max(0.5, scale));
    // Never overshoot the remaining calories when there is a budget.
    if (budget > 0 && tpl.calories * scale > budget) {
      scale = Math.max(0.5, budget / tpl.calories);
    }

    cards.push({
      id: `meal-${++cardId}`,
      name: tpl.name,
      emoji: tpl.emoji,
      tags: tpl.tags,
      portion: Math.round(scale * 100) / 100,
      calories: round5(tpl.calories * scale),
      protein: Math.round(tpl.protein * scale),
      carbs: Math.round(tpl.carbs * scale),
      fat: Math.round(tpl.fat * scale),
    });
  }
  return cards;
}

// Quick-log presets for the manual logger on the Dashboard.
export const QUICK_MEALS = [
  { name: 'Small Snack', emoji: '🍎', calories: 150, protein: 4, carbs: 25, fat: 4 },
  { name: 'Regular Meal', emoji: '🍱', calories: 550, protein: 35, carbs: 55, fat: 18 },
  { name: 'Big Meal', emoji: '🍝', calories: 850, protein: 45, carbs: 90, fat: 30 },
];

// "AI" results for the simulated Photo Plate Scanner (premium feature).
export const SCANNER_RESULTS = [
  { name: 'Chicken & Veggie Plate', emoji: '🍽️', calories: 480, protein: 40, carbs: 38, fat: 16 },
  { name: 'Pasta Bolognese', emoji: '🍝', calories: 720, protein: 32, carbs: 88, fat: 24 },
  { name: 'Avocado Toast + Eggs', emoji: '🥑', calories: 430, protein: 21, carbs: 36, fat: 22 },
  { name: 'Sushi Combo (12 pc)', emoji: '🍣', calories: 560, protein: 28, carbs: 78, fat: 12 },
  { name: 'Burger & Fries', emoji: '🍔', calories: 940, protein: 38, carbs: 92, fat: 44 },
];
