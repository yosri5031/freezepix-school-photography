const shopUrl = 'YOUR-STORE.myshopify.com'; // Replace with your shop URL
const accessToken = 'shpat_xxxxx'; // Replace with your access token

async function updateAllProductsInventory() {
    console.log('Starting inventory update process...');

    try {
        // Fetch all products
        console.log('Fetching products...');
        const productsResponse = await fetch(
            `https://${shopUrl}/admin/api/2024-01/products.json`,
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!productsResponse.ok) {
            throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
        }

        const productsData = await productsResponse.json();
        console.log(`Found ${productsData.products.length} products`);

        // Update inventory for each variant
        let updatedCount = 0;
        for (const product of productsData.products) {
            console.log(`Processing product: ${product.title}`);
            
            for (const variant of product.variants) {
                try {
                    const inventoryItemId = variant.inventory_item_id;
                    
                    // Get inventory levels for this variant
                    const inventoryResponse = await fetch(
                        `https://${shopUrl}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${inventoryItemId}`,
                        {
                            headers: {
                                'X-Shopify-Access-Token': accessToken,
                                'Content-Type': 'application/json',
                            }
                        }
                    );

                    if (!inventoryResponse.ok) {
                        throw new Error(`Failed to fetch inventory levels: ${inventoryResponse.statusText}`);
                    }

                    const inventoryData = await inventoryResponse.json();
                    
                    if (inventoryData.inventory_levels.length > 0) {
                        const locationId = inventoryData.inventory_levels[0].location_id;

                        // Update inventory
                        const updateResponse = await fetch(
                            `https://${shopUrl}/admin/api/2024-01/inventory_levels/set.json`,
                            {
                                method: 'POST',
                                headers: {
                                    'X-Shopify-Access-Token': accessToken,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    location_id: locationId,
                                    inventory_item_id: inventoryItemId,
                                    available: 999999
                                })
                            }
                        );

                        if (!updateResponse.ok) {
                            throw new Error(`Failed to update inventory: ${updateResponse.statusText}`);
                        }

                        updatedCount++;
                        console.log(`Updated variant ${variant.title} (ID: ${variant.id}) to 999999 stock`);
                    }
                } catch (variantError) {
                    console.error(`Error updating variant ${variant.id}: ${variantError.message}`);
                }
            }
        }

        console.log(`\nInventory update complete!`);
        console.log(`Successfully updated ${updatedCount} variants`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the function
updateAllProductsInventory();