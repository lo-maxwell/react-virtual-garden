import shutil
import os

# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define source and destination directories for inventory items with absolute paths
source_dir_inventory = os.path.join(script_dir, '../items/inventoryItems/temp')
destination_dir_inventory = os.path.join(script_dir, '../items/inventoryItems/final')

# Ensure the destination directory exists for inventory items
os.makedirs(destination_dir_inventory, exist_ok=True)

# Copy the entire directory from source to destination for inventory items
shutil.copytree(source_dir_inventory, destination_dir_inventory, dirs_exist_ok=True)

# Define source and destination directories for placed items with absolute paths
source_dir_placed = os.path.join(script_dir, '../items/placedItems/temp')
destination_dir_placed = os.path.join(script_dir, '../items/placedItems/final')

# Ensure the destination directory exists for placed items
os.makedirs(destination_dir_placed, exist_ok=True)

# Copy the entire directory from source to destination for placed items
shutil.copytree(source_dir_placed, destination_dir_placed, dirs_exist_ok=True)

# Define source and destination directories for placed items with absolute paths
source_dir_placed = os.path.join(script_dir, '../items/tools/temp')
destination_dir_placed = os.path.join(script_dir, '../items/tools/final')

# Ensure the destination directory exists for placed items
os.makedirs(destination_dir_placed, exist_ok=True)

# Copy the entire directory from source to destination for placed items
shutil.copytree(source_dir_placed, destination_dir_placed, dirs_exist_ok=True)

# Define source and destination directories for placed items with absolute paths
source_dir_placed = os.path.join(script_dir, '../user/temp')
destination_dir_placed = os.path.join(script_dir, '../user/final')

# Ensure the destination directory exists for placed items
os.makedirs(destination_dir_placed, exist_ok=True)

# Copy the entire directory from source to destination for placed items
shutil.copytree(source_dir_placed, destination_dir_placed, dirs_exist_ok=True)

print("Contents copied from inventory, placed, tool items temp to final.")

# Workflow: addPlantToCSV -> cleanItemCSV -> copyTempToFinal -> itemCSVToJson or allCSVToJson