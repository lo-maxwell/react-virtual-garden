import os
import pandas as pd
import json

def clean_item_csvs():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define the directories with absolute paths
    inventory_dir = os.path.join(script_dir, '../items/inventoryItems/temp')
    placed_dir = os.path.join(script_dir, '../items/placedItems/temp')
    
    
    # List to keep track of removed rows
    removed_rows = []

    # Function to process CSV files
    def process_csv(file_path):
        nonlocal removed_rows
        # Read the CSV file
        df = pd.read_csv(file_path)
        
        # Convert to JSON objects
        json_objects = df.to_dict(orient='records')
        
        # Remove duplicates based on 'id'
        original_count = len(json_objects)
        df_unique = df.drop_duplicates(subset='id')
        new_count = len(df_unique)
        
        # Identify removed rows
        if original_count > new_count:
            removed = original_count - new_count
            removed_rows.append((file_path, removed))
        
        # Sort by 'id'
        df_sorted = df_unique.sort_values(by='id')
        
        # Write the sorted DataFrame back to the original CSV
        df_sorted.to_csv(file_path, index=False)

        # Print the sorted JSON objects
        # print(json.dumps(df_sorted.to_dict(orient='records'), indent=4))

    # Process all CSV files in both directories
    for directory in [inventory_dir, placed_dir]:
        for filename in os.listdir(directory):
            if filename.endswith('.csv'):
                process_csv(os.path.join(directory, filename))

    # Print removed rows summary
    for file_path, count in removed_rows:
        print(f"Removed {count} rows from {file_path}")
    
    print(f"Cleaning complete, removed {len(removed_rows)} rows in total.")


# Call the function
clean_item_csvs()