# **Goose Design Overview**

## Goal

- Game currently doesn't have any geese in it despite being called goose farm (besides the very expensive decorations)
- Geese should be the endgame, so we need some infinite diminishing returns on getting better geese
- Either a way to consume geese or some reason we have to keep upgrading (breeding where parents die afterwards?)
- Regular farming should tie into geese, geese can require certain foods to stay happy/level up
- Geese shoud tie into making regular farm better, either just by giving money/rare items or actively placing them to buff surroundings

- Keep scope limited for now - separation of finished goose product and plants
- Goose eggs can use the same inventoryItem/placedItem system to incubate on the farm
- Geese needs another tab where you can view all (?) or make them inventory items (??)

## Goose Implementation Details

### Goose States
1.  **InventoryItem Egg**:
    *   This will be a new `InventoryItem` subtype.
    *   Obtained through daily login bonuses, random drops from harvesting plants, or potentially purchased from a special store.
    *   Can be placed on a plot in the garden, similar to seeds.

2.  **PlacedItem Egg**:
    *   This will be a new `PlacedItem` subtype, similar to `Plant`.
    *   When an `InventoryItem Egg` is used on a plot, it transforms into a `PlacedItem Egg`.
    *   `PlacedItem Eggs` will have a "grow time" similar to plants, after which they "hatch" into a `Goose`.
    *   The plot background could change color or display a special animation to indicate it's a `PlacedItem Egg`.
    *   Tooltips for `PlacedItem Eggs` will display remaining hatch time and potential goose stats.

3.  **Goose (New Object/Model)**:
    *   This will be a new top-level object/model, similar to `User`, `Garden`, `Inventory`, etc.
    *   `Goose` objects will have various stats (e.g., Power, Intelligence, Charisma) and potentially a `color` or `type`.
    *   They will reside in a new "Goose Pen" or "Goose Inventory" which will be a new context/page.
    *   A cap will be placed on the number of `Goose` objects a user can have.
    *   `Goose` objects can provide bonuses to surrounding plots (e.g., increased yield, reduced grow time) when placed in the garden as a special `PlacedItem`.
    *   `Goose` objects can be "consumed" or "bred" for diminishing returns, tying into the endgame loop.
    *   `Goose` objects might require specific `InventoryItem` foods to stay happy or level up.

### Integration with Existing Infrastructure

#### Frontend:
*   **Inventory/Store**: Update `Item` templates and interfaces to include `GooseEgg` as a new `InventoryItem` type. Modify store logic to handle `GooseEgg` purchases/sales.
*   **Garden**: Update plot interaction logic to allow placing `GooseEgg` items.
*   **New Goose Page/Context**: Create a new UI to display and manage `Goose` objects, including their stats, placement options, and consumption/breeding mechanisms.
*   **Tooltips**: Extend tooltip functionality to display information for `PlacedItem Eggs` and `Goose` objects.
*   **User Icon Selection**: Potentially allow harvested/obtained `Goose` objects to be used as user icons.

#### Backend (AWS RDS, Lambda, API Routes):
*   **Database Schema**:
    *   Create a new table for `Goose` objects to store their unique `id`, `user_id`, `type`, `color`, and stats (Power, Intelligence, Charisma, etc.).
    *   `PlacedItem` table might need an additional field to differentiate between `Plant` and `PlacedItem Egg` or a new `PlacedGooseEgg` table.
*   **API Routes/Services**:
    *   **`createGooseEgg`**: An API route/service function to create `InventoryItem Eggs` (e.g., for daily login rewards or random drops).
    *   **`plantGooseEgg`**: An API route/service function to handle placing an `InventoryItem Egg` onto a plot, converting it to a `PlacedItem Egg` in the database.
    *   **`hatchGoose`**: An API route/service function that triggers when a `PlacedItem Egg`'s grow time is complete, converting it into a `Goose` object in the database and updating the plot.
    *   **`placeGoose`**: An API route/service function to place an existing `Goose` object onto a plot (as a special `PlacedItem`).
    *   **`removeGoose`**: An API route/service function to remove a `Goose` from the garden or "consume" it.
    *   **`feedGoose`**: An API route/service function to consume an `InventoryItem` to feed a `Goose`, potentially affecting its stats or happiness.
    *   **`fetchGooseData`**: API route/service to fetch all `Goose` objects for a user.
    *   **`updateGooseStats`**: API route/service to update `Goose` stats (e.g., after feeding or breeding).
*   **Lambda Functions**: Update existing Lambda functions or create new ones to interact with the new `Goose` table and handle the logic for the `createGooseEgg`, `plantGooseEgg`, `hatchGoose`, `placeGoose`, `removeGoose`, `feedGoose`, `fetchGooseData`, and `updateGooseStats` services.
*   **Validation**: Add validation for goose-related actions (e.g., `Goose` cap, valid plot for placing eggs/geese).

### Considerations for Existing Infrastructure:
*   **Items**: Leverage the existing `InventoryItem` and `PlacedItem` abstract classes by creating new subclasses for `GooseEgg` and `PlacedGooseEgg`.
*   **Garden/Plots**: The existing `Plot` and `Garden` models can largely remain the same, with added logic to handle `PlacedItem Eggs` and `Goose` objects.
*   **LevelSystem**: `Goose` interactions (hatching, feeding) could potentially give user XP.
*   **History**: Record `Goose` related actions (planting egg, hatching, feeding) in `ActionHistory` and `ItemHistory`.
*   **Stores**: Introduce a new `GooseStore` or modify the existing `Store` to sell `Goose Eggs` or `Goose` related items.
*   **Daily Login Reward**: Integrate `Goose Eggs` as a potential daily login reward.
*   **Data Files**: Add new data files for `Goose` templates and initial stats.

## MVP Roadmap for Goose Implementation

To achieve a Minimum Viable Product (MVP) for geese as soon as possible, here's a prioritized order of implementation, focusing on leveraging existing infrastructure and introducing new core logic incrementally:

### Phase 1: Core Data & Basic Egg Lifecycle (Foundational & Reusable)

This phase focuses on getting goose eggs into the game and making them behave like existing items until they hatch.

1.  **Backend - Database Schema for `Goose`:**
    *   Create the new `Goose` table in AWS RDS. This table will hold unique `Goose` objects with fields like `id`, `user_id`, `type`, `color`, and a few essential stats (e.g., `power`). This is the absolute foundation for individual geese.

2.  **Backend - `GooseEgg` as `InventoryItem` and `PlacedItem`:**
    *   Create new subclasses for `InventoryItem` and `PlacedItem`, specifically `GooseEgg` and `PlacedGooseEgg`. These will extend existing abstract classes.
    *   Add `GooseEgg` templates to your existing data files (e.g., `items.json`), defining its basic properties and "grow time" (hatch time).
    *   Modify existing API routes/services (`createItem`, `plantSeed`) to handle the creation of `InventoryItem GooseEgg` (e.g., as a daily login reward) and its placement on a plot, transforming it into a `PlacedGooseEgg`.
    *   If your `PlacedItem` table doesn't already have a mechanism to differentiate between plants and other placed items, add a simple `item_type` column to distinguish `PlacedGooseEgg`.

3.  **Frontend - Display `InventoryItem Egg` & `PlacedItem Egg`:**
    *   Update your `Inventory` and `Store` UI components to correctly display the new `GooseEgg` items.
    *   Modify the `Garden` UI to visually represent a `PlacedGooseEgg` on a plot (e.g., a simple egg icon).
    *   Extend `Tooltip` functionality to show basic information for `GooseEgg` and `PlacedGooseEgg` (e.g., "Goose Egg", "Hatching in X hours/minutes").

### Phase 2: Hatching & Basic Goose Object (Introducing New Core Logic)

This phase introduces the core "hatching" mechanic and the first view of your unique `Goose` objects.

4.  **Backend - `hatchGoose` Logic & API:**
    *   Implement the crucial logic for `hatchGoose`. This service function will:
        *   Check if a `PlacedGooseEgg` on a plot has completed its "grow time".
        *   Remove the `PlacedGooseEgg` from the plot.
        *   Create a *new*, unique `Goose` object based on templates/randomness and insert it into the `Goose` table.
        *   Update the plot to be empty or display a placeholder indicating a goose has hatched.
    *   Create a dedicated API route/service (e.g., `/api/goose/hatch`) for this operation.
    *   Update relevant Lambda functions to handle this new database interaction.

5.  **Backend - `fetchGooseData` API:**
    *   Create a new API route/service (e.g., `/api/goose/fetch`) to retrieve all `Goose` objects associated with a specific user from the `Goose` table.
    *   Implement the corresponding Lambda function for this data fetching.

6.  **Frontend - Basic Goose Display Page:**
    *   Create a **minimal new "Goose Pen" or "Goose List" page/component** in your frontend. This page will be responsible for fetching `Goose` objects using your new `fetchGooseData` API and displaying them in a simple list, showing their basic `type`, `color`, and `power` stats. This does *not* need to be an interactive placement system yet, just a view of owned geese.
    *   Add a navigation link to this new page.

### Phase 3: Minimal Interaction & Refinement (Enhancements for MVP)

Once the core lifecycle is working, these steps add basic interactivity.

7.  **Frontend/Backend - Daily Login Integration for Eggs:**
    *   Ensure that the daily login reward system is properly configured to grant `InventoryItem GooseEgg`s.

8.  **Backend - Basic Validation:**
    *   Implement essential validation checks for goose-related actions (e.g., ensuring a plot is empty before placing an egg, checking if the user has reached their goose cap before hatching).

9.  **Frontend - Enhanced UI Feedback for `PlacedItem Eggs`:**
    *   **Tooltip for Potential Bonuses:** Implement a tooltip for `PlacedItem Eggs` that explains the *current potential bonus* a goose would receive if hatched immediately, based on the adjacent plants (or global plants, depending on the chosen bonus strategy). For the MVP (Lazy Calculation at `hatchGoose`), this would be a static calculation performed on hover, reflecting the current garden state.
    *   **Settings Toggle: Prevent "Harvest All" Interference:** Add a user setting (e.g., in a settings menu) that, when enabled, prevents the "Harvest All" button from affecting plants that are currently providing bonuses to `PlacedItem Eggs`. This would likely involve a warning popup or simply skipping those plants.
    *   **Settings Toggle: Prevent Single Harvest Interference:** Similar to the "Harvest All" toggle, but for individual plant harvests. When enabled, a warning or prevention mechanism would activate if a player tries to harvest a plant directly impacting an adjacent `PlacedItem Egg`'s potential bonus.

10. **Frontend - Additional UI Elements and Settings:**
    *   **Visual Indicator for Influencing Plants:** Highlight or provide a subtle visual effect on plots containing plants that are currently influencing a `PlacedItem Egg`'s potential bonus. This provides immediate visual feedback.
    *   **Hatching Progress Bar/Timer:** A clear visual progress bar or countdown timer on `PlacedItem Eggs` to indicate how much time is remaining until they hatch.
    *   **Goose Pen Sorting/Filtering:** In the new Goose Pen UI, add options to sort geese by various stats (Power, Intelligence, Charisma), color, type, or age. Include filters to easily view specific categories of geese.
    *   **Goose Placement Preview (Future Iteration beyond MVP):** When a user is attempting to place a hatched `Goose` object into a garden plot, a UI overlay that shows the *projected bonuses* the goose would grant to its surrounding plots in that specific location.
    *   **Goose "Consume" / "Release" Confirmation:** A clear confirmation dialog with an explanation of the irreversible nature and any potential rewards/losses before a player "consumes" or "releases" a goose from their Goose Pen.
    *   **Setting Toggle: Auto-Collect Daily Goose Eggs:** An optional user setting to automatically add daily login `GooseEgg`s to the inventory if space is available, streamlining the collection process.

This MVP roadmap focuses on establishing the unique `Goose` object in your database and giving users a basic way to obtain, hatch, and view their geese. More complex interactions like feeding, breeding, specific plot bonuses, and a richer UI can be added in subsequent iterations.

## Goose Bonuses & Serverless Considerations

The goal is for hatched geese to gain bonuses based on other plants in the garden (adjacent or possibly not). This requires a system to evaluate the surrounding environment and apply effects, all while being mindful of serverless costs and performance.

#### Evaluation of Proposed Methods:

1.  **Check plants when placing the egg:**
    *   **Pros:** Simplest to implement, very low computation cost (one-time calculation).
    *   **Cons:** The bonus would be static and fixed at the moment of egg placement. It wouldn't react to any changes in the garden *after* the egg is placed (e.g., new plants growing, existing plants being harvested or removed). This limits dynamic gameplay.

2.  **Check plants when harvesting the egg (i.e., when it hatches):**
    *   **Pros:** Accounts for the final state of the garden when the goose is created, still a one-time calculation per egg.
    *   **Cons:** No real-time feedback or progressive bonuses during the egg's "growth" phase. The user wouldn't know the potential bonus until the goose actually hatches.

3.  **Every time the user plants a new plant, update all eggs:**
    *   **Pros:** Allows for dynamic, near real-time updates to potential bonuses for placed eggs.
    *   **Cons (Significant for Serverless):** This approach would be very inefficient and potentially expensive. Every `plantSeed` API call would trigger additional Lambda invocations (one for each active `PlacedItem Egg` to recalculate its bonus). As the garden and number of eggs grow, this could lead to high costs, increased latency for planting, and potential rate-limiting issues. It scales poorly in a serverless model.

#### Additional Serverless-Friendly Strategies:

4.  **Scheduled Batch Recalculation:**
    *   Instead of reacting to every plant action, implement a scheduled Lambda function (e.g., hourly, daily, or less frequently) that iterates through all active `PlacedItem Eggs` for a user and recalculates their potential bonuses based on the current garden state.
    *   **Pros:** Decouples bonus calculation from individual user actions, leading to more predictable costs. Reduces the load on frequently called APIs like `plantSeed`.
    *   **Cons:** Not truly real-time. Users would see bonuses update in batches, not instantly.

5.  **Lazy Calculation at `hatchGoose` (Recommended for MVP):**
    *   This builds on your second suggestion but emphasizes its serverless suitability. The full bonus calculation (based on the current garden state) is performed only *once* when the `hatchGoose` API is called, finalizing the goose's stats.
    *   **Pros:** Highly cost-effective as calculations only happen when absolutely necessary (at the point of goose creation). Simplifies the event flow.
    *   **Cons:** No dynamic feedback for the user *during* the egg's growth. The final bonus isn't known until the goose hatches.

6.  **Hybrid Snapshot + Lazy Evaluation:**
    *   When an `InventoryItem Egg` is placed on a plot (becomes `PlacedItem Egg`), take a snapshot of the *immediate surroundings* that contribute to a base bonus. Store this snapshot data with the `PlacedGooseEgg` in the database.
    *   When `hatchGoose` is called, perform the final bonus calculation by combining the initial snapshot data with any *additional* dynamic elements (e.g., changes to specific plant types, or global garden bonuses that don't depend on adjacency).
    *   **Pros:** Provides a starting point for the bonus, allows for some dynamic elements without constant recalculation.
    *   **Cons:** More complex to implement than purely lazy calculation.

#### Recommended Approach for MVP (Goose Bonuses):

For the MVP, the most straightforward and cost-effective approach for a serverless architecture is **Lazy Calculation at `hatchGoose` (Strategy 5)**.

*   **Implementation:** When the `hatchGoose` service function is invoked, it will query the database for the current state of the garden plots (or specific plots, if adjacency is a factor) that are relevant to the `PlacedItem Egg` being hatched. It then performs the bonus calculation based on these retrieved plant properties (e.g., `category`, `type`, `quantity`). The resulting bonus is then applied to the newly created `Goose` object's stats before it's saved to the `Goose` table.
*   **Adjacency vs. Global:**
    *   **Global Bonuses:** Calculating bonuses based on *all* plants in the garden is simpler for a serverless function, as it involves a single database query to fetch all plants for a user's garden.
    *   **Adjacent Bonuses:** For adjacency, the `hatchGoose` function would need to query specific `Plot` records based on the hatched egg's coordinates and its immediate neighbors (e.g., fetching `plot` records where `row` is `egg_row +/- 1` and `column` is `egg_column +/- 1`). This is still manageable but requires more specific querying. It's recommended to start with simpler "global" bonuses for an MVP if complexity is a concern.
*   **Future Enhancements:** If dynamic feedback during egg growth becomes a critical feature, you could introduce **Scheduled Batch Recalculation (Strategy 4)** in a later phase to update a "potential bonus" field on `PlacedItem Eggs` that would be displayed in tooltips.
