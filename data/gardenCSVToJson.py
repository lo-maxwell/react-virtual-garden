import csv
import json

# Define the input and output file paths
tools_file_path = 'garden/tools.csv'
json_file_path = 'final/Garden_From_CSV.json'

# Initialize the data structure for JSON output
data = {
    "Tools": []
}

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
        data["Tools"].append(tool)

# Write the JSON data to the output file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=4)

print("Garden CSV has been converted to JSON format successfully.")