# Virtual-Garden-Blog

## Day 1

### Set up a new app using Next.js + React

### Upload to git

### Write design doc

## Day 2

### Building infrastructure/models/writing tests

### Run tests with npm test

## Day 3

### Building more infrastructure + writing more tests
  * Working on Inventory + ItemList right now, next goal is plots/gardens

## Day 4

### Add useItem functions to inventory/garden
  * Allows swapping/converting items into other forms (seed -> plant -> harvestedItem)

### Refactor code for readability

## Day 5

### Start working on ui for garden, plot component that displays the item icon

### Added placeItem function to plot

## Day 6

### Create Store class which holds a list of items for sale and modifies inventories

  * See design doc
  * Created ItemStore abstract class that is extended by Store and Inventory
  * Store contains functions to specifically buy/sell things from inventories
  * Added localStorage save/load to Store, Inventory, Garden

### Refactored ui code

## Day 7

### Added store page and trade window

  * Store page consists of store inventory, player inventory, trade window
  * Refactored item component to be reusable between player and store inventory
  * Refactored selector to differentiate player and store items
  * Trade window contains buttons to modify quantity of item being traded
  * Added LongPressButton component to continuously run the addQuantity function when holding down a button
  * Added exponential scaling to addQuantity, so that we can add up to 100000 items in about 10 seconds

## Day 8

### Converted store to a context + useStore 

  * Added store, restock, reset
  * TODO: convert garden and inventory to contexts

### Added LevelSystem for garden

### Improved serialize/deserialize methods for models, better error handling

## Day 9

### Converted garden and inventory to contexts + custom hook

### Redoing item templates and moving data to a data file for ease of content creation later

### Refactored items, item templates, fromPlainObject

  * Rewrote generatePlaceholder items
  * Added functions to get the class from an item
  * Turned inventory/placed items into abstract class, implemented subtypes as classes
  * Turned inventory/placed templates into abstract class, implemented subtypes
  * Wrote tests for to/fromPlainObject

## Day 10

### Added expand/shrink row buttons

  * Can only expand to 5 + level/5
  * Can shrink to 1

### Added tests to verify save/loading of item templates

  * Still need to add tests for items

### Added plantTime to plots and time to grow to plants

  * Setup for adding grow timers to plants
  * Plot background now changes colors when plants are finished growing


TODO:

Make Items only take in their respective templates

Refactor PlacedItems

Write tests for refactored code

Generate multiple store types/switch between stores/restock store
Clean up ui, especially font/scaling using rem, to accommodate more screen width
Trade Window Multiselect + Total

Sort/Order Inventory by filters - itemid, alphabetical, type?

Make Garden more interactive than plant all -> harvest 

Timer per plot + timePlaced per plot + green highlight when ready? status as display string?

Add ToPlainObject method for all models

Mouse over tooltips for items

Add User class

ExpandRow/Col doesn't automatically rerender garden, might need a force refresh
Also breaks if you expand col, probably because of not rerendering

Redo ItemTemplate so we can add item specific stats ie exp for plants

Redo Placeholder Item Templates so it's easier to add new content

Add level requirement to plants/seeds

Stretch Goals
Instead of expanding row/col, have the user add 1 plot at a time
This is a design flaw, not a coding one -- right now supports exponential growth when it should be linear, also easier to make iterative progress
Probably requires an entirely new ui though for the user to select their next plot location
Or don't allow buying expansions/limit it per level
Add random events/natural disasters that interact with decorations ie. scarecrows, fences