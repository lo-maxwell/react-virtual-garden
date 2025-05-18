import csv
import copy

plantData = {
    "name": "pineapple",
    "icon": "🍍",
    "category": "Tropical",
    "item": "Pineapple",
    "description": "Error",
    "seedValue": 200,
    "value": 200,
    "harvestedValue": 200,
    "level": 0,
    "baseExp": 20,
    "growTime": 14400,
    "repeatedGrowTime": 7200,
    "numHarvests": 3,
    "shinyIds": {
        "bronze": {
            "probability": 0.6,
            "idSuffix": "01"
        },
        "silver": {
            "probability": 0.3,
            "idSuffix": "02"
        },
        "gold": {
            "probability": 0.1,
            "idSuffix": "03"
        },
    }
}


def categoryToId(category):
    category_map = {
        "Onion": "01",
        "Leafy Green": "02",
        "Nightshade": "03",
        "Legume": "04",
        "Grain": "05",
        "Squash": "06",
        "Herb": "07",
        "Root Vegetable": "08",
        "Tree Fruit": "09",
        "Tropical": "10",
        "Berry": "11",
        "Citrus": "12",
        "Vine Fruit": "13",
        "Sea Vegetable": "14",
        "Error": "99"
    }
    return category_map.get(category, "99")

def itemToId(crop, category):
    crop_map = {
        "Onion": {
            "Garlic": "01",
            "Green Onion": "02",
            "Leek": "03",
            "Red Onion": "04",
            "Shallot": "05",
            "Onion": "06"
        },
        "Leafy Green": {
            "Broccoli": "01",
            "Cabbage": "02",
            "Cauliflower": "03",
            "Kale": "04"
        },
        "Nightshade": {
            "Bell Pepper": "01",
            "Eggplant": "02",
            "Tomato": "03"
        },
        "Legume": {
            "Beans": "01",
            "Chickpeas": "02",
            "Lentils": "03",
            "Peas": "04"
        },
        "Grain": {
            "Barley": "01",
            "Corn": "02",
            "Rice": "03",
            "Wheat": "04"
        },
        "Squash": {
            "Butternut Squash": "01",
            "Cucumber": "02",
            "Pumpkin": "03",
            "Zucchini": "04"
        },
        "Herb": {
            "Basil": "01",
            "Mint": "02",
            "Parsley": "03",
            "Rosemary": "04",
            "Thyme": "05"
        },
        "Root Vegetable": {
            "Beet": "01",
            "Carrot": "02",
            "Parsnip": "03",
            "Radish": "04",
            "Sweet Potato": "05",
            "Turnip": "06"
        },
        "Tree Fruit": {
            "Apple": "01",
            "Cherry": "02",
            "Peach": "03",
            "Pear": "04",
            "Plum": "05"
        },
        "Tropical": {
            "Banana": "01",
            "Coconut": "02",
            "Mango": "03",
            "Papaya": "04",
            "Pineapple": "05"
        },
        "Berry": {
            "Blackberry": "01",
            "Blueberry": "02",
            "Cranberry": "03",
            "Raspberry": "04",
            "Strawberry": "05"
        },
        "Citrus": {
            "Grapefruit": "01",
            "Lemon": "02",
            "Lime": "03",
            "Orange": "04"
        },
        "Vine Fruit": {
            "Grape": "01",
            "Kiwi": "02",
            "Melon": "03",
            "Passionfruit": "04"
        },
        "Sea Vegetable": {
            "Dulse": "01",
            "Kelp": "02",
            "Nori": "03",
            "Wakame": "04"
        }
    }
    
    return crop_map.get(category, {}).get(crop, "00")  # Default to "00" if crop or category not found


def generateId(type, subtype, category, item, variant):
    id = ''
    if (type == 'PlacedItem'):
        id += '0-'
    elif (type == 'InventoryItem'):
        id += '1-'
    else:
        raise ValueError("Invalid type")

    if (subtype == 'Ground'):
        id += '00-'
    elif (subtype == 'Seed'):
        id += '01-'
    elif (subtype == 'Plant'):
        id += '02-'
    elif (subtype == 'HarvestedItem'):
        id += '03-'
    elif (subtype == 'Decoration'):
        id += '04-'
    elif (subtype == 'Blueprint'):
        id += '05-'
    else:
        raise ValueError("Invalid subtype")
    
    id += categoryToId(category) + '-'

    id += itemToId(item, category) + '-'

    id += variant

    return id

plantData["type"] = "PlacedItem"
plantData["subtype"] = "Plant"
plantData["id"] = generateId(plantData["type"], plantData["subtype"], plantData["category"], plantData["item"], "00")

seedData = copy.deepcopy(plantData)
seedData["name"] = plantData["name"] + " seed"
seedData["type"] = "InventoryItem"
seedData["subtype"] = "Seed"
seedData["id"] = generateId(seedData["type"], seedData["subtype"], seedData["category"], seedData["item"], "00")
seedData["value"] = plantData["seedValue"]

harvestedData = copy.deepcopy(plantData)
harvestedData["type"] = "InventoryItem"
harvestedData["subtype"] = "HarvestedItem"
harvestedData["id"] = generateId(harvestedData["type"], harvestedData["subtype"], harvestedData["category"], harvestedData["item"], "00")
harvestedData["value"] = harvestedData["harvestedValue"]

seedData["transformId"] = plantData["id"]
plantData["transformId"] = harvestedData["id"]

def addPlantToCSV(plantData):
    with open('../items/placedItems/temp/plants.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            plantData["id"],
            plantData["name"],
            plantData["icon"],
            plantData["type"],
            plantData["subtype"],
            plantData["category"],
            plantData["description"],
            plantData["value"],
            plantData["level"],
            plantData["transformId"],
            plantData["baseExp"],
            plantData["growTime"],
            plantData["repeatedGrowTime"],
            plantData["numHarvests"]
        ])

def addSeedToCSV(seedData):
    with open('../items/inventoryItems/temp/seeds.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            seedData["id"],
            seedData["name"],
            seedData["icon"],
            seedData["type"],
            seedData["subtype"],
            seedData["category"],
            seedData["description"],
            seedData["value"],
            seedData["level"],
            seedData["transformId"]
        ])

def addHarvestedToCSV(harvestedData):
    with open('../items/inventoryItems/temp/harvested.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            harvestedData["id"],
            harvestedData["name"],
            harvestedData["icon"],
            harvestedData["type"],
            harvestedData["subtype"],
            harvestedData["category"],
            harvestedData["description"],
            harvestedData["value"],
            harvestedData["level"]
        ])

def getShinyValueMultiplier(tier):
    if (tier == 'bronze'):
        return 2
    elif (tier == 'silver'):
        return 5
    elif (tier == 'gold'):
        return 10
    return 1

def addShinyItemRates(plantData):
    with open('../items/placedItems/temp/shinyItemRates.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        
        for tier, shiny_info in plantData["shinyIds"].items():
            shiny_item_id = harvestedData["id"][:-2] + shiny_info["idSuffix"] # Construct the shiny item ID
            shiny_item_name = f"{tier} {plantData['name']}"  # Construct the shiny item name
            probability = shiny_info["probability"]  # Get the probability from shiny_info
            plant_id = plantData["id"]  # Use the original harvestedData ID
            
            writer.writerow([
                shiny_item_id,
                shiny_item_name,
                tier,
                probability,
                plant_id
            ])

# Call the function to add the plant data
addPlantToCSV(plantData)

# Call the function to add the seed data
addSeedToCSV(seedData)

# Call the function to add the original harvested data
addHarvestedToCSV(harvestedData)

# Create additional harvested items for shiny versions
for tier, shiny_info in plantData["shinyIds"].items():
    shiny_harvestedData = copy.deepcopy(harvestedData)  # Create a copy of the original harvestedData
    shiny_harvestedData["name"] = f"{tier} {plantData['name']}"  # Set the new name
    shiny_harvestedData["id"] = harvestedData["id"][:-2] + shiny_info["idSuffix"]  # Update the ID
    shiny_harvestedData["description"] = f"{tier} version of {plantData['name']}"  # Set the new description
    shiny_harvestedData["value"] = harvestedData["value"] * getShinyValueMultiplier(tier)
    # Call the function to add the shiny harvested data
    addHarvestedToCSV(shiny_harvestedData)

# Call the function to add shiny item rates
addShinyItemRates(plantData)



