import csv
import json
import os  # Ensure this import is at the top of your file

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define the input and output file paths with absolute paths
blueprint_file_path = os.path.join(script_dir, '../items/inventoryItems/final/blueprints.csv')
harvested_file_path = os.path.join(script_dir, '../items/inventoryItems/final/harvested.csv')
seeds_file_path = os.path.join(script_dir, '../items/inventoryItems/final/seeds.csv')
inventory_eggs_file_path = os.path.join(script_dir, '../items/inventoryItems/final/eggs.csv')
decorations_file_path = os.path.join(script_dir, '../items/placedItems/final/decorations.csv')
ground_file_path = os.path.join(script_dir, '../items/placedItems/final/ground.csv')
plants_file_path = os.path.join(script_dir, '../items/placedItems/final/plants.csv')
shiny_file_path = os.path.join(script_dir, '../items/placedItems/final/shinyItemRates.csv')
placed_eggs_file_path = os.path.join(script_dir, '../items/placedItems/final/eggs.csv')
tools_file_path = os.path.join(script_dir, '../items/tools/final/tools.csv')
json_file_path = os.path.join(script_dir, '../final/temp/Items.json')

# Initialize the data structure for JSON output
data = {
    "PlacedItems": {
        "Plants": [],
        "Decorations": [],
        "Ground": [],
        "PlacedEggs": []
    },
    "InventoryItems": {
        "Seeds": [],
        "HarvestedItems": [],
        "Blueprints": [],
        "InventoryEggs": []
    },
    "Tools": {
        "Shovels": []
    }
}

with open(blueprint_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    for row in csv_reader:
        blueprint = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"]
        }
        data["InventoryItems"]["Blueprints"].append(blueprint)


with open(harvested_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    for row in csv_reader:
        harvested = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"])
        }
        data["InventoryItems"]["HarvestedItems"].append(harvested)


with open(seeds_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    for row in csv_reader:
        seed = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"]
        }
        data["InventoryItems"]["Seeds"].append(seed)


with open(decorations_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    for row in csv_reader:
        decoration = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"]
        }
        data["PlacedItems"]["Decorations"].append(decoration)


with open(ground_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    for row in csv_reader:
        ground = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"]
        }
        data["PlacedItems"]["Ground"].append(ground)

transformShinyIdMap = {}
with open(shiny_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for row in csv_reader:
        plantId = row["plantId"]
        tier = row["tier"]
        if plantId not in transformShinyIdMap:
            transformShinyIdMap[plantId] = {} 
        
        transformShinyIdMap[plantId][tier] = {
            "id": row["id"],
            "probability": float(row["probability"])
        }


with open(plants_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    # id,name,icon,type,subtype,category,description,value,level,transformId,baseExp,growTime,repeatedGrowTime,numHarvests
    for row in csv_reader:
        plant = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"],
            "baseExp": int(row["baseExp"]),
            "growTime": int(row["growTime"]),
            "repeatedGrowTime": int(row["repeatedGrowTime"]),
            "numHarvests": int(row["numHarvests"]),
            "transformShinyIds": transformShinyIdMap.get(row["id"], {})
        }
        data["PlacedItems"]["Plants"].append(plant)


with open(placed_eggs_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    # id,name,icon,type,subtype,category,description,value,level,transformId,baseExp,growTime,repeatedGrowTime,numHarvests
    for row in csv_reader:
        egg = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"],
            "baseExp": int(row["baseExp"]),
            "growTime": int(row["growTime"])
        }
        data["PlacedItems"]["PlacedEggs"].append(egg)

with open(inventory_eggs_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    # Process each row in the CSV
    for row in csv_reader:
        inventory_egg = {
            "id": row["id"],
            "name": row["name"],
            "icon": row["icon"],
            "type": row["type"],
            "subtype": row["subtype"],
            "category": row["category"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"]),
            "transformId": row["transformId"]
        }
        data["InventoryItems"]["InventoryEggs"].append(inventory_egg)

with open(tools_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    # Process each row in the CSV
    for row in csv_reader:
        tool = {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "icon": row["icon"],
            "description": row["description"],
            "value": int(row["value"]),
            "level": int(row["level"])
        }
        data["Tools"][(row["type"] + "s")].append(tool)

# Write the JSON data to the output file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)

print("Item CSV has been converted to JSON format successfully.")
