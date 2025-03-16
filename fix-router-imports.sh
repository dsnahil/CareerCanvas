#!/bin/bash

# Find all .jsx files in the frontend/src directory
find frontend/src -name "*.jsx" -type f | while read -r file; do
  # Replace all imports from "react-router" with "react-router-dom"
  sed -i '' 's/from "react-router"/from "react-router-dom"/g' "$file"
done

echo "All imports from react-router have been replaced with react-router-dom" 