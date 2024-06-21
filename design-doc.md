# **Virtual Garden Design Doc**

## Functional Description

2D grid based farming simulator with user auth + individual gardens/customization. Built with react, typescript, nextjs, postgresql. Hosted on vercel (?)

## Features
  * Build a virtual garden by planting seeds, placing decorations, and harvesting/selling crops to expand your land
  * Each user owns their own garden and has a separate money supply
  * All users share a global store with a rotating selection of items
  * User Authentication with Auth0
  * Data storage with PostgreSQL
  * Multiple pages routed with NextJS App Router

## Models

### Garden
  * Contains the user's entire sum of land
  * UserId - String
  * Rows - Int
  * Cols - Int
  * PlotList - Array of Plots
  * React Component - Grid of Plot Square Components
    * Maybe also some header information, but mostly just holds the plots of land

### Plot
  * A single square representing an area of land. Can contain a single plant, decoration, or nothing.
  * PlacedItem - The contained object (plant, decoration, empty)
  * XPosition - Int
  * YPosition - Int
  * React Component - Basically a square that contains the item

### ItemTemplate
  * Contains the shared information about an item, but is not an instance of one
  * These are all constant, so we just load them from an internal file, not stored to database.
  * Id - Int
  * Name - String
  * Icon - String (Emoji)
  * Type - String (Placed, Inventory)
  * Subtype - String (Plant, Decoration, Ground, Seed, HarvestedItem, Blueprint)
  * BasePrice - Value for selling to the shop. Shop sells back items for BasePrice * multiplier.
  * TransformId - Int -- Seed -> plant, plant -> ground (+ generate a harvested item in inventory), ground -> ground, blueprint -> decoration, decoration -> ground (+ generate a blueprint item in inventory)

### PlacedItem
  * Placed in individual plots
  * ItemData - ItemTemplate
  * Status - String? Enum? -- Various statuses like alive, dead, needs watering, not sure yet
  * React Component - Clickable button that displays the icon, onClick = bring up selection menu to harvest/move/remove etc

### Plant
  * Extends PlacedItem, can be harvested to turn the plot into ground, and place a harvestedItem into inventory.
  * EndGrowTime - DateTime -- Determines if the plant is harvestable or not
  * Specific selection of icons to represent plants

### Decoration
  * Extends PlacedItem, can be moved, can be removed to turn the plot into ground, and place a blueprint into inventory.
  * Specific selection of icons to represent decorations

### EmptyItem (Ground)
  * Extends PlacedItem
  * Specific selection of icons to represent dirt/ground/water

### InventoryItem
  * Held in inventory
  * ItemData - ItemTemplate
  * Quantity - Number of this item owned
  * React Component - Clickable button that displays the icon, onClick = bring up selection menu to buy/sell/place etc

### Seed
  * Extends InventoryItem, creates a plant upon being placed
  * Specific selection of icons to represent seeds

### HarvestedItem
  * Extends InventoryItem, cannot be planted, only sold
  * Same selection of icons as plants

### Blueprint
  * Extends InventoryItem, creates a decoration upon being placed
  * Specific selection of icons to represent decorations

### Inventory
  * Tied to a specific user
  * UserId - String
  * Gold - Int
  * ItemList - Array of InventoryItems
  * React Component - Header + Item List

### Store
  * Global list of items that can be bought by players.
  * CostMultiplier - float -- the shop sells items for higher than their resale price.
  * ItemList - Array of InventoryItems
  * React Component - Header + Item List

### User
  * Username - String
  * Icon - Image (?) or int indexing into list of preselected avatars
  * Tagline - String
  * React Component - User Bubble
    * Displays Username, Icon, clickable link to user page

Might need a controller to pass data from user to garden?

## Database
  * PostgreSQL

### Users Table
  * UserId [Primary Key] String
  * Username String
  * Icon Int
  * Tagline String

### Gardens Table
  * GardenId [Serial Primary Key] Int
  * UserId String NOT NULL
  * Rows Int NOT NULL
  * Cols Int NOT NULL
  * Foreign Key: UserId -> Users.UserId

### Plots Table
  * PlotId [Serial Primary Key] Int
  * GardenId Int NOT NULL
  * XPosition INT NOT NULL
  * YPosition INT NOT NULL
  * PlacedItemId INT
  * PlacedItemType (Plant, Decoration, Empty)
  * Foreign Key: GardenId -> Gardens.GardenId

### ItemTemplates Table - Not used until we need to dynamically update any of these properties
  * ItemTemplateId [Serial Primary Key] Int
  * Name String NOT NULL
  * Icon String NOT NULL
  * Type String NOT NULL (Placed, Inventory)
  * Subtype String NOT NULL (Plant, Decoration, Empty, Seed, HarvestedPlant, Blueprint)
  * BasePrice Int NOT NULL
  * TransformId Int (Points to another id within this table)
  * Foreign Key: TransformId -> ItemTemplates.ItemTemplateId

### PlacedItems Table
  * PlacedItemId [Serial Primary Key] Int
  * ItemTemplateId Int NOT NULL
  * EndGrowTime Timestamp (Only for plants)
  * Status String
  * Type String NOT NULL (Plant, Decoration, Empty)
  * ~~Foreign Key: ItemTemplateId -> ItemTemplates.ItemTemplateId~~

### Inventory Table
  * InventoryId [Serial Primary Key] Int
  * UserId String NOT NULL
  * Gold Int NOT NULL Default 0
  * Foreign Key: UserId -> Users.UserId

### InventoryItems Table
  * InventoryItemId [Serial Primary Key] Int
  * InventoryId Int NOT NULL
  * ItemTemplateId Int NOT NULL
  * Quantity Int NOT NULL
  * Type String NOT NULL (Seed, HarvestedItem, Blueprint)
  * Foreign Key: InventoryId -> Inventory.InventoryId
  * ~~Foreign Key: ItemTemplateId -> ItemTemplates.ItemId~~

### Stores Table
  * StoreId [Serial Primary Key] Int
  * CostMultiplier Float NOT NULL

### StoreItems Table
  * StoreItemId [Serial Primary Key] Int
  * StoreId Int NOT NULL
  * InventoryItemId Int NOT NULL
  * Foreign Key: StoreId -> Stores.StoreId
  * Foreign Key: InventoryItemId -> InventoryItems.InventoryItemId

## Pages

### Title Page
  * If logged in: redirect to main page
  * Explanation of website
  * Button go to login page

### Garden Page
  * If not logged in: redirect to login page
  * Displays Garden (containing plots + placedItems), Inventory
  * Button to go to shop page

### Shop page
  * If not logged in: redirect to login page
  * Displays shop inventory + buttons to buy things with

### Login Page
  * If logged in: redirect to main page
  * Button to perform login with auth0

### User Account Page
  * Home button in top left corner to navigate to garden page
  * If logged in, but not logged into this user: 
    * Display username, icon, tagline
  * If logged into this user:
    * Display username, icon, tagline
    * Allow editing of icon, tagline
    * Button to log out

## External Setup
  * Need an external database, or use vercel postgres
  * Look into firebase, dynamodb, aws rds/aurora
  * Need auth0 for user auth

  
## Goals/Timeline

  * Set up webpage - get a blank page to load, with some default text
  * Build classes/model infrastructure
    * Build set of possible items, later we will make this in the db
  * Build a static garden with fixed data
    * Fixed rows/cols, populate with some plants/decorations
  * Build a static inventory with fixed data
  * Build a static store with fixed data
  * Build a static user with the garden and inventory
  * Add interaction
    * Garden plants can be harvested
	* Inventory items can be placed
	* User can buy items from the store
  * Add user auth - require login to access the page
  * Add localhost db
  * Build server actions to access db
    * Allow persistence of data and start tracking garden, inventory, user etc
  * Build apis to access db, redirect server actions to these apis
    * Use env variables to store secrets
  * 
  * Extra features:
    * 

