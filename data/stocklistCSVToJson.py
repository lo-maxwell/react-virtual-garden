import csv
import json

# Define the input and output file paths
stocklist_file_path = 'store/stocklist.csv'
json_file_path = 'final/Stocklists_From_CSV.json'
data = {
    "Stocklists": []
}

with open(stocklist_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)

    # Process each row in the CSV
    for row in csv_reader:
        stocklist_id = row["id"]
        stocklist_name = row["name"]

        # Check if the id-name pair exists in data["Stocklists"]
        stocklist_exists = next((s for s in data["Stocklists"] if s["id"] == stocklist_id and s["name"] == stocklist_name), None)

        # If it does not exist, create a new stocklist
        if not stocklist_exists:
            stocklist_exists = {
                "id": stocklist_id,
                "name": stocklist_name,
                "items": []
            }
            data["Stocklists"].append(stocklist_exists)

        # Create item and append to the corresponding stocklist
        item = {
            "name": row["itemName"],
            "quantity": int(row["quantity"])
        }
        stocklist_exists["items"].append(item)

# Write the JSON data to the output file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)

print("Stocklist CSV has been converted to JSON format successfully.")