#!/bin/bash

echo "🔑 Azure Client Secret Updater"
echo "=============================="
echo ""
echo "Please paste your Azure client secret (it will be hidden):"
read -s secret

if [ -z "$secret" ]; then
    echo "❌ No secret provided. Exiting."
    exit 1
fi

# Update the .env file
sed -i '' "s/REPLACE_WITH_YOUR_ACTUAL_SECRET/$secret/" .env

echo "✅ .env file updated successfully!"
echo ""
echo "Now run: npm run complete-setup"
