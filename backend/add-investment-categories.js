const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Use service role key for admin tasks
const supabase = createClient(supabaseUrl, supabaseKey);

const addInvestmentCategories = async () => {
    try {
        // 1. Fetch all users
        const { data, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) {
            throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        const users = data.users;
        if (!users || !Array.isArray(users)) {
            throw new Error('No users found or the response is not as expected.');
        }


        console.log(`Found ${users.length} users. Checking and adding investment categories...`);

        for (const user of users) {
            const userId = user.id;

            // 2. Check for existing investment categories for the user
            const { data: existingCategories, error: checkError } = await supabase
                .from('categories')
                .select('name')
                .eq('userId', userId)
                .in('name', ['Make Investments', 'Withdraw Investments']);

            if (checkError) {
                console.error(`Failed to check categories for user ${userId}:`, checkError.message);
                continue; // Skip to the next user
            }

            const existingCategoryNames = existingCategories.map(c => c.name);
            const categoriesToAdd = [];

            if (!existingCategoryNames.includes('Make Investments')) {
                categoriesToAdd.push({ name: 'Make Investments', typeId: 3, userId: userId });
            }

            if (!existingCategoryNames.includes('Withdraw Investments')) {
                categoriesToAdd.push({ name: 'Withdraw Investments', typeId: 3, userId: userId });
            }

            // 3. Add missing categories
            if (categoriesToAdd.length > 0) {
                const { error: insertError } = await supabase
                    .from('categories')
                    .insert(categoriesToAdd);

                if (insertError) {
                    console.error(`Failed to add categories for user ${userId}:`, insertError.message);
                } else {
                    console.log(`Added missing investment categories for user ${userId}.`);
                }
            } else {
                console.log(`User ${userId} already has both investment categories.`);
            }
        }

        console.log('Finished processing all users.');

    } catch (error) {
        console.error('An unexpected error occurred:', error.message);
    }
};

addInvestmentCategories(); 