# **Virtual Garden Design Doc**

## Functional Description

2D grid based farming simulator with user auth + individual gardens/customization. Built with react, typescript, nextjs, postgresql. Hosted on vercel (?)

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

### PlacedItem
  * Placed in individual plots
  * Name - String
  * Icon - String (Emoji)
  * React Component - Clickable button that displays the icon, onClick = bring up selection menu to harvest/move/remove etc

### Plant
  * Extends PlacedItem, can be harvested
  * EndGrowTime - DateTime -- Determines if the plant is harvestable or not
  * Value - $ gained when harvested
  * Status - String? Enum? -- Various statuses like alive, dead, needs watering, not sure yet
  * Specific selection of icons to represent plants

### PlacedDecoration
  * Extends PlacedItem, can be moved
  * Specific selection of icons to represent decorations

### EmptyItem (Ground)
  * Extends PlacedItem
  * Specific selection of icons to represent dirt/ground/water

### InventoryItem
  * Held in inventory
  * Name - String
  * Icon - String (Emoji)
  * BasePrice - Value for selling to the shop. Shop sells back items for BasePrice * multiplier.
  * Quantity - Number of this item owned
  * React Component - Clickable button that displays the icon, onClick = bring up selection menu to buy/sell/place etc

### Seed
  * Extends InventoryItem, creates a plant upon being placed
  * Specific selection of icons to represent seeds

### InventoryDecoration
  * Extends InventoryItem, creates a placeddecoration upon being placed
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

### PlacedItems Table
  * PlacedItemId [Serial Primary Key] Int
  * Name String NOT NULL
  * Icon String NOT NULL
  * Type String NOT NULL (Plant, Decoration, Empty)

### Plants Table
  * PlacedItemId [Primary Key] Int
  * EndGrowTime Timestamp NOT NULL
  * Value Int NOT NULL
  * Status String
  * Foreign Key: PlacedItemId -> PlacedItems.PlacedItemId

### PlacedDecorations Table
  * PlacedItemId [Primary Key] Int
  * Foreign Key: PlacedItemId -> PlacedItems.PlacedItemId

### EmptyItems Table
  * PlacedItemId [Primary Key] Int
  * Foreign Key: PlacedItemId -> PlacedItems.PlacedItemId

### Inventory Table
  * InventoryId [Serial Primary Key] Int
  * UserId String NOT NULL
  * Gold Int NOT NULL
  * Foreign Key: UserId -> Users.UserId

### InventoryItems Table
  * InventoryItemId [Serial Primary Key] Int
  * InventoryId Int NOT NULL
  * Name String NOT NULL
  * Icon String NOT NULL
  * BasePrice Int NOT NULL
  * Quantity Int NOT NULL
  * Type String NOT NULL (Seed, InventoryDecoration)
  * Foreign Key: InventoryId -> Inventory.InventoryId

### Seeds Table
  * InventoryItemId [Serial Primary Key] Int
  * Foreign Key: InventoryItemId -> InventoryItems.InventoryItemId

### InventoryDecorationTable
  * InventoryItemId [Serial Primary Key] Int
  * Foreign Key: InventoryItemId -> InventoryItems.InventoryItemId

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

## Features


## External Setup

  
## Goals/Timeline

  * Set up webpage - get a blank page to load, with some default text
  * 
  * Extra features:
    * 

