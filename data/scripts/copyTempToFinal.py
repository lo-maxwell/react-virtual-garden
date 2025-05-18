import shutil
import os

# Define source and destination directories for inventory items
source_dir_inventory = '../items/inventoryItems/temp'
destination_dir_inventory = '../items/inventoryItems/final'

# Ensure the destination directory exists for inventory items
os.makedirs(destination_dir_inventory, exist_ok=True)

# Copy the entire directory from source to destination for inventory items
shutil.copytree(source_dir_inventory, destination_dir_inventory, dirs_exist_ok=True)

# Define source and destination directories for placed items
source_dir_placed = '../items/placedItems/temp'
destination_dir_placed = '../items/placedItems/final'

# Ensure the destination directory exists for placed items
os.makedirs(destination_dir_placed, exist_ok=True)

# Copy the entire directory from source to destination for placed items
shutil.copytree(source_dir_placed, destination_dir_placed, dirs_exist_ok=True)

print("Contents copied from inventory and placed items temp to final.")

# Workflow: addPlantToCSV -> cleanItemCSV -> copyTempToFinal -> itemCSVToJson or allCSVToJson