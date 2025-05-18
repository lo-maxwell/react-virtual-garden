import csv
import json
import os  # Ensure this import is at the top of your file

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define the input and output file paths with absolute paths
stores_file_path = os.path.join(script_dir, '../store/stores.csv')
json_file_path = os.path.join(script_dir, '../final/temp/Stores.json')


# Initialize the data structure for JSON output
data = {
    "Stores": []
}

with open(stores_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
	# id,name,stocklistId,stocklistName,buyMultiplier,sellMultiplier,upgradeMultiplier,restockInterval

    # Process each row in the CSV
    for row in csv_reader:
        store = {
            "id": int(row["id"]),
            "name": row["name"],
            "stocklistId": row["stocklistId"],
            "stocklistName": row["stocklistName"],
            "buyMultiplier": float(row["buyMultiplier"]),
            "sellMultiplier": float(row["sellMultiplier"]),
            "upgradeMultiplier": float(row["upgradeMultiplier"]),
            "restockInterval": int(row["restockInterval"])
        }
        data["Stores"].append(store)

# Write the JSON data to the output file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)

print("Store CSV has been converted to JSON format successfully.")