````markdown
# Design System Document

## 1. Overview & Creative North Star: "The Culinary Alchemist"

This design system moves away from the utilitarian "grid of boxes" common in food apps. Instead, it adopts the **Culinary Alchemist** aesthetic—a high-end, editorial approach that treats meal planning like a premium lifestyle magazine.

The experience is defined by **Deep Atmospheric Immersion**. We use a dark emerald base to make food photography pop with hyper-realistic vibrancy. By utilizing intentional asymmetry, overlapping typography, and "floating" glass layers, we create a UI that feels curated and tactile rather than programmed. We reject the "standard app" look by prioritizing negative space and tonal depth over rigid borders and heavy shadows.

---

## 2. Colors & Surface Philosophy

### The Emerald Palette

Our palette is rooted in organic darkness. We use `surface` tokens to build a sense of environmental depth.

- **Primary (`#69dd96` / `#3cb371`):** Use for "Success" actions, progress indicators, and active states.
- **Surface Hierarchy:**
  - `surface` (`#0e1512`): The base canvas.
  - `surface_container_low` (`#161d1a`): Large section backgrounds.
  - `surface_container` (`#1a211e`): Default card background.
  - `surface_container_highest` (`#2f3633`): Elevated elements (active toggles, floating buttons).
- **Tertiary Accents (`#e9c400`):** Reserved strictly for nutritional highlights (Kcal, Protein) to create a "gold-leaf" luxury feel against the emerald.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be achieved through:

1.  **Background Shifts:** Placing a `surface_container_low` card atop a `surface` background.
2.  **Negative Space:** Using the `8` (2.75rem) spacing token to create a mental break between content blocks.

### The Glass & Gradient Rule

For the "Tinder-style" meal cards, use a **Glassmorphism** overlay for the text description. Apply `surface_container` at 60% opacity with a `backdrop-blur` of 20px. Use a subtle linear gradient from `primary` to `primary_container` (at 15% opacity) on CTA buttons to provide a "lit-from-within" glow.

---

## 3. Typography: Editorial Authority

We pair two distinct personalities: the architectural strength of **Epilogue** and the functional clarity of **Be Vietnam Pro**.

- **Display & Headlines (Epilogue):** These are your "hooks." Use `display-md` for meal titles. The tight tracking and bold weight should feel like a premium cookbook header.
- **Body (Be Vietnam Pro):** Used for ingredient lists and instructions. It offers high legibility at small scales.
- **Stats (Manrope):** Use `label-md` for nutritional data. The geometric nature of Manrope ensures numbers (450 kcal, 30g Protein) feel precise and technical.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "digital." We achieve lift through **Tonal Layering** and **Ambient Glows**.

- **The Layering Principle:** Stack `surface_container_lowest` for the main background, `surface_container` for the swipe cards, and `surface_bright` for the "Like/Dislike" feedback indicators.
- **Ambient Shadows:** If a card must float, use a shadow with a 40px blur, 0px offset, and 6% opacity using the `on_surface` color. This creates a soft "halo" rather than a heavy shadow.
- **Ghost Borders:** If accessibility requires a stroke (e.g., in high-contrast modes), use `outline_variant` at 15% opacity. Never use a 100% opaque stroke.

---

## 5. Components

### Swipeable Meal Cards

- **Corner Radius:** `lg` (2rem) for the main image to create a friendly, organic feel.
- **Overlays:** Info overlays (title, prep time) should use the Glassmorphism rule.
- **Interaction:** On-swipe, the card should scale down by 5% and rotate slightly (2-3 degrees) to mimic physical paper.

### Bottom Navigation (5 Tabs)

- **Visual Style:** A floating pill shape using `surface_container_highest` with a `backdrop-blur`.
- **Active State:** Instead of a simple color change, use a `primary_fixed` icon with a small `primary` dot beneath it.
- **No Dividers:** The navigation bar sits "free" at the bottom of the screen with a `20` (7rem) bottom margin for the content underneath.

### Week Selectors

- **Container:** `surface_container_low`.
- **Active Day:** Circular `primary` background with `on_primary` text.
- **Inactive Day:** Transparent background with `on_surface_variant` text.

### Nutritional Chips

- **Style:** `surface_container_highest` background with a 1px `tertiary` "Ghost Border" (10% opacity).
- **Typography:** `label-md` (Manrope) for maximum readability of numbers.

### Checklists & Toggles

- **Checklists:** Forbid the standard square box. Use a circular "hollow" ring (`outline`) that fills with `primary` and a checkmark on selection.
- **Toggles:** Use a "Switch-Pill" design. The track is `surface_container_highest`, and the thumb is `primary`.

---

## 6. Do's and Don'ts

### Do

- **DO** use high-quality, "hero" style food photography. The image is the UI.
- **DO** leave significant "Breathing Room." If a screen feels crowded, increase spacing to the next tier in the scale.
- **DO** use `tertiary` (Gold) sparingly—only for vital stats to ensure they act as "visual anchors."

### Don't

- **DON'T** use pure black (#000000). Always use the emerald-tinted `surface` (`#0e1512`) to maintain the atmospheric mood.
- **DON'T** use 1px dividers between ingredients. Use `body-sm` with increased line-height and `surface_variant` background shifts.
- **DON'T** use standard "Material Design" blue or red. All feedback must remain within the Emerald/Gold/Error-Red spectrum.

---

## 7. Scaling & Spacing Reference

- **Standard Padding:** `4` (1.4rem) for screen edges.
- **Card Internal Padding:** `3` (1rem).
- **Section Spacing:** `8` (2.75rem).

_This system is designed to feel like a high-end digital concierge. Every interaction should feel smooth, muted, and premium._```
````
