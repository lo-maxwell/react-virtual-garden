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

## Day 11

### Built tooltip component

  * Plots now show tooltips on hover, displaying the value of the harvested item and how much grow time is remaining
  * Added infrastructure for inventory/trade window tooltips, though the content is to be desired
  * Added tooltips for inventory items

### Reworked store restock function

  * restockTime is now set to the time when restock is ready
  * New restockInterval field to determine the new restockTime
  * Loading a store (on refresh) will immediately restock if necessary
  * If restocking does not add any items, restockInterval is not changed
  * Store now restocks properly (interval seconds after items are purchased)

### Refactored items

  * Added item interfaces to prevent circular dependencies
  * Reworked fromPlainObject to only serialize the id, name, and type, and grab all relevant data from the items.json file
  * This causes items to update automatically when the user refreshes
  * If this ever goes live service might want to force a refresh when a new patch comes out, or users will see the wrong display

## Day 12

### Refactored items

  * Added item categories (mostly used for plant families) and descriptions
  * Updated templates + interfaces to reflect this change
  * Updated id formula to reflect this change
  * Renamed harvested x to just x; sharing names is okay because we split between plants and harvested

### UI Changes

  * Added item categories to the tooltips
  * Updated StoreProvider to more easily add new items to store
  * Fixed issue with tooltips not properly updating when the page is scrolled

## Day 13

### UI Changes

  * Moved selectedItem and owner to a provider/context, allowing easier access from internal components
  * SelectedItem now sets to null if you click an already selected item
  * Added tooltips for empty plots when a blueprint or seed is selected
  * Added dropdowns for filtering inventories by subtype and category
  * Refactored store and inventory for code reuse
  * Fixed issue with inventory not updating when garden is interacted with
    * Added inventoryForceRefreshKey as a hack to the inventoryProvider, used to refresh the item list manually
  * Updated text on plot tooltips to display more useful information on remaining time/grow time


## Day 14

### Added User Class

  * Only contains username, icon, levelsystem for now
  * Levelsystem was moved from garden to user; things that gave the garden xp now give the user xp
  * Added UserContextProvider with functions to modify username and icon
  * Need to implement history/stats tracker

### Added User page

  * Garden page now displays some basic user information
  * User page now allows modification of username and icon
  * Can only select icons from the plants subtype
  * Added popup for icon selection

### Other UI changes

  * Refactored ui to use const instead of functions for all permanent elements

### Added mango item

## Day 15

### Working on history class

  * Stores a record of how many times items/buttons were interacted with by a user
  * Building history, historylist, tests
  * ItemHistory and ActionHistory
  * Finished test cases for ActionHistory and ActionHistoryList

### UI Changes

  * Store now highlights changed prices in orange and displays the markup fee
  * Refactored tradeWindowItem for code reuse
  * Added new text colors for inventory items

## Day 16

### Adding History to User Page

  * Actionhistory, Itemhistory
  * IconSelector only displays icons for items that you have harvested before

### UI Changes

  * Selected item in inventory is now highlighted
  * Plot tooltips now only display numbers between 1 and growtime, causing lag at the start but finishing at 1s
  * Inventory cuts off at 60% of viewport height, and allows scrolling
  * Added more colors for tailwind
  * Removed debug options from main screen, now only accesible by clicking profile image 30 times
  * Moved garden expansion options into hidden folder, and gave them tooltips
  * Garden expansion options are disabled if too large/small

## Day 17

### Store update

  * New store.json and stocklist.json data files
  * Stores now grab stocklist from data files, so they will update instantly
  * Allows for future expansions of additional store types
  * Changed some text colors

### User Icon Selection now depends on plants/decorations harvested/placed

### Added multiple harvests to certain plants

  * Right now initial harvest takes growTime, then subsequent harvests take growTime/2
  * Eventually will change to have specific timers
  * Need to work out a way to better display this information

## Day 18

### Looking into how to host external database and poll user data from there

  * Added some test files for querying from local postgres db
  * Not pushing .env, some things will break if forked

## Day 19

### Added infrastructure for toolbox class

  * Users will have a toolbox, which appears on the garden screen for special actions
  * ie. a shovel to remove plants and move decorations
  * TODO: tools are upgradeable and can give special bonuses, so we store each user's individual set of tools
  * TODO: tools can be purchased in the store (on a separate page, not as part of the inventory), which removes the existing tool of that type if there is one (only 1 shovel at a time)
  * TODO: tools actually impact the garden

## Day 20

### Wasted money on AWS aurora instance even though the database was empty

### Added postgres local database

  * Accessible with pool/query
  * Writing services and apis to interact with db
  * Harvest all is broken for xp because it calculates the new xp before updating the database, so all writes will update the db with the same values. Need to stagger read times or calculate the expected xp increase.
  * Plots need ids (or just row/column/owner) so we can track them in database
  * Maybe plots are always in existence (once user is leveled), expanding/shrinking just shows/hides them and makes them uninteractable

## Day 21-30

### Working on database schemas, services, api routing, integrating database queries with updating backend models

### Added repository, service, routing for the following:
  * User
  * LevelSystem
  * Garden
  * Plot
  * PlacedItem
  * Inventory
  * InventoryItem
  * Store
  * StoreItem
  * ItemHistory
  * ActionHistory
  * Contains various functions to interact with database and send/receive data from api routes

### Create X Service functions should take in the model and use it to produce the entire object in database

### Plots are no longer deleted by resizing garden, only hidden

### Added service functions for the following:

  * Create/Save/Fetch Account
  * PlantSeed
  * PlaceDecoration
  * HarvestPlant
  * PickupDecoration
  * Expand/Shrink Garden Rows
  * Expand/Shrink Garden Columns
  * Buy/Sell Items
  * Update username/icon

### Added cloud save enable/disable button (currently disabled for production)

## Day 31

### Firebase auth

  * Setup firebase project and enable auth
  * Register this webapp to firebase project
  * npm install firebase
  * Create auth context and wrap content in it
  * Implement sign in and sign out buttons
  * Protect certain pages when not signed in 
  * Display user data
  * Link firebase auth with database
  * Protect api routes based on login

### Firebase account creation

  * New User
  * User has an empty User, Garden, Inventory, Store object: Good to go
  * User has existing User/Garden/Inventory/Store: data migration eventually, right now just a warning that it'll be deleted
  * User presses register account button
  * Firebase creates account, returning an auth token
  * Server verifies auth token (in api layer)
    * Add reusable middleware to avoid duplicating token verification code in every api route
  * Server creates database entries with default parameters
  * Server returns created objects
  * Firebase links returned role to custom claims
  * Client loads returned objects into memory and propagates to contexts
  * Added auth wrappers around most api calls
  * On login, loads the user's garden from database
  * On logout, unloads the garden ?
    * Garden/store/user shouldn't be visible while logged out anyways, it should redirect to login
    * Unless in guest mode

### UI changes

  * Updated header
  * Account icon and dropdown menu
  * Updated description on login screen
  * Added react-redux to track item quantities for instant updating when planting/harvesting/buying/selling

## Day 32

### AWS Database setup
  * Create aws rds instance
  * Configure security/allowed routes with EC2
  * Get connection details (endpoint, port, username/password, database name)
  * Update environment variables with connection details
  * Connect to rds with psql and setup admin rights/owners
  * Consider adding custom initialization script to set up tables
  * Test locally
  * Redeploy app

### Created private rds
  * Created prod and dev databases
  * Created prod_admin and dev_admin users with full permissions
  * Setup initial tables
  * Created security groups to disallow incoming traffic except from bastion host

### Created bastion host
  * Created ec2 instance to act as an ssh tunnel
  * Created security group to only allow incoming traffic from my local ip
  * Allows outgoing traffic to internal ecosystem, aka the private rds
  * Run ssh command in terminal to enable port forwarding from localhost to rds
  * Now able to connect to rds with pgadmin, psql, or environment variables in webapp

### Create Lambda + API Gateway
  * Lambda function that exposes http/rest endpoints, accessible by frontend
  * Has access to private vpc, allowing querying of rds
  * Frontend sends http request that triggers lambda function, which performs database queries and returns json data
  * Secure gateway using api keys, iam roles, or oauth, and ssl/tls encryption
  * Flow: user presses button on frontend -> frontend sends request to backend -> backend authenticates with firebase -> backend sends request to api gateway (containing api key on server side) -> api gateway calls lambda function -> return json data to frontend
  * To consider: separate api keys per user, which would allow deactivation/rate limiting per user

### Currently investigating aws lambda...
  * Use xmin for concurrency
  * Client -> api route -> service function -> lambda call to fetch data from db -> data processing -> lambda call to update db -> return result to client
  * Right now each service function has 2 lambdas, consider code reuse
  * TODO: Give nextjs a specific iam role with only invokeLambda permissions

## Day 33

### UI QOL Changes
  * Force Refresh Saved Data button
    * Disabled clicking button while syncing in progress, and gave indication that function is running
    * Needs to give some progress/success/failure indication, maybe make a notification system?

## Day 34

### Deployed AWS lambda and cloud saving

### Building infra for easier modification of items
  * Created some csvs to store item data, might be easier to write a script to parse the csv into json than to parse the csv from client side


## Day 35

### Added Toolbox and first tool
  * Toolbox contains new tool items, shovel item can be used to destroy plants before they are finished growing (to remove them permanently, freeing up space)
  * Added additional infra around database connections and json loading of tool data

## Day 36

### More ui updates
  * Various fixes to tooltips, ui display of destroying items, added infrastructure for switching from emoji string icons to svgs
  * Added front page banner
  * Various login panel updates

## Day 37

### Adding userEvents - In progress
  * Will be used for daily login reward
  * Added infrastructure for various user events stored in database
  * Added DailyLoginReward event

### Adding eventRewards - In progress
  * Stores the actual rewards received
  * Not currently stored in database

### Added Daily Login Button on garden page
  * Creates an eventReward and adds it to the user's inventory
  * Claimable once per day

## Day 38

### Stored userEvents, eventRewards, eventRewardItems in database
  * Underlying object only uses the most recently occurring event, but we log all events in database for future use

## Day 39

### Added extra validation on backend calls
  * Now properly syncs with cloud when validation fails while planting/harvesting
  * Fixed unnecessary fetch calls

### UI Changes
  * Updated names in some locations
  * Daily login rewards now have 2 stages on popup, claim and see rewards. Also now clickable when rewards already claimed, to show previous rewards.

## Day 40

### Updated mobile ui
  * Updated navbar, added css styles for narrow screens, thanks @ivywu100

## Day 41

### More UI polish
  * Updated inventory item colors to better differentiate item types
  * Added settings and confirmation dialogue before deleting plants with shovel
  * Removed unused friends list

## Day 42

### UI Optimization
  * Refactoring with lots of useCallback/useMemo for fewer rerenders
  * Cleaning up legacy code
  

TODO:

Optimize RDS calls, consider using rds proxy if horizontal scaling is needed (30+ concurrent connections)

Move service functions into lambda

Convert to IAC with IAC generator, test output, possibly move to another stack
