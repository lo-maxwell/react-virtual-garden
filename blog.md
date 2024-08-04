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
  * Plants can only be harvested when enough time has passed
  * Added messages to garden to display when plants are placed/harvested

### Built tooltip component

  * Plots now show tooltips on hover, displaying the value of the harvested item and how much grow time is remaining
  * Added infrastructure for inventory/trade window tooltips, though the content is to be desired
  * Added tooltips for inventory items



TODO:

Make Items only take in their respective templates

Refactor PlacedItems

Write tests for refactored code

Generate multiple store types/switch between stores/restock store
Clean up ui, especially font/scaling using rem, to accommodate more screen width
Trade Window Multiselect + Total

Sort/Order Inventory by filters - itemid, alphabetical, type?

Make Garden more interactive than plant all -> harvest 

Fix save/load of items to grab the new itemtemplates so that people can't stay on old items

Mouse over tooltips for items

Add User class

Add level requirement to plants/seeds

Add way to delete in progress plants, some sort of select delete tool

Add multiple harvests to some plants

Add description to itemTemplate

Add fertilizer item - chance for double harvest, or reduce grow time

Add toolkit - select (plant, harvest, pickup, place); delete (only in progress plants)

Store sells seeds for base price, not 2x (?)

Stretch Goals
Instead of expanding row/col, have the user add 1 plot at a time
This is a design flaw, not a coding one -- right now supports exponential growth when it should be linear, also easier to make iterative progress
Probably requires an entirely new ui though for the user to select their next plot location
Or don't allow buying expansions/limit it per level
Add random events/natural disasters that interact with decorations ie. scarecrows, fences