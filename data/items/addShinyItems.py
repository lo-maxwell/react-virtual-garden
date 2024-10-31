import json

# Load the items.json file
with open('data/items/Items.json', 'r', encoding='utf-8') as file:
    items = json.load(file)

# Prepare a dictionary to hold new harvested items
new_harvested_items = {}

# Iterate through each plant and create new harvested items
for plant in items['PlacedItems']['Plants']:
    original_value = plant['value']
    original_name = plant['name']
    # Create new harvested items for bronze, silver, and gold
    if 'transformShinyIds' in plant:
        for tier, shiny_info in plant['transformShinyIds'].items():
            # Determine the multiplier based on the tier
            multiplier = 1  # Default multiplier
            if tier == 'bronze':
                multiplier = 2
            elif tier == 'silver':
                multiplier = 5
            elif tier == 'gold':
                multiplier = 10
            
            new_item = {
                'id': shiny_info['id'],  # Use the shiny ID
                'name': f"{tier.capitalize()} {original_name}",  # Name like "Bronze Apple"
                'icon': plant['icon'],  # Use the same icon as the original
                'type': 'InventoryItem',  # Assuming a new type for harvested items
                'subtype': 'Harvested',  # You can adjust this as needed
                'category': plant['category'],  # Use the same category
                'description': f"{tier.capitalize()} version of {original_name}",  # Description
                'value': original_value * multiplier,  # Adjusted value based on tier
                'level': plant['level']  # Set level as needed
            }
            # Use the name as the key to overwrite existing items
            new_harvested_items[new_item['name']] = new_item

# Add or overwrite the new harvested items in the InventoryItems section
if 'InventoryItems' not in items:
    items['InventoryItems'] = {'HarvestedItems': []}

# Create a list to hold the updated harvested items
updated_harvested_items = []

# Check existing harvested items and overwrite if necessary
existing_harvested_items = {item['name']: item for item in items['InventoryItems'].get('HarvestedItems', [])}

# Update existing items or add new ones
for item_name, new_item in new_harvested_items.items():
    existing_harvested_items[item_name] = new_item  # Overwrite or add

# Convert the dictionary back to a list
updated_harvested_items = list(existing_harvested_items.values())

# Update the InventoryItems section
items['InventoryItems']['HarvestedItems'] = updated_harvested_items

# Write the updated items back to the file
with open('data/items/Items.json', 'w', encoding='utf-8') as file:
    json.dump(items, file, ensure_ascii=False, indent=2)

print(f"Updated or added harvested items for bronze, silver, and gold versions.")