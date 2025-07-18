// const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config();

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

// Asset functions
async function addAsset(supabase, userId, name, type, value) {
  const { data, error } = await supabase.from('assets').insert([{ user_id: userId, name, type, value }]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function updateAsset(supabase, assetId, name, type, value) {
  const { data, error } = await supabase.from('assets').update({ name, type, value }).eq('id', assetId).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function deleteAsset(supabase, assetId) {
  const { error } = await supabase.from('assets').delete().eq('id', assetId);
  if (error) throw new Error(error.message);
  return { message: 'Asset deleted successfully' };
}

async function getAssets(supabase, userId) {
    const { data, error } = await supabase.from('assets').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data;
}

// Liability functions
async function addLiability(supabase, userId, name, type, amount) {
  const { data, error } = await supabase.from('liabilities').insert([{ user_id: userId, name, type, amount }]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function updateLiability(supabase, liabilityId, name, type, amount) {
  const { data, error } = await supabase.from('liabilities').update({ name, type, amount }).eq('id', liabilityId).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function deleteLiability(supabase, liabilityId) {
  const { error } = await supabase.from('liabilities').delete().eq('id', liabilityId);
  if (error) throw new Error(error.message);
  return { message: 'Liability deleted successfully' };
}

async function getLiabilities(supabase, userId) {
    const { data, error } = await supabase.from('liabilities').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data;
}

// Net worth calculation
async function getNetWorth(supabase, userId) {
  const { data: assets, error: assetsError } = await supabase.from('assets').select('value').eq('user_id', userId);
  if (assetsError) throw new Error(assetsError.message);
  
  const { data: liabilities, error: liabilitiesError } = await supabase.from('liabilities').select('amount').eq('user_id', userId);
  if (liabilitiesError) throw new Error(liabilitiesError.message);

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  return { totalAssets, totalLiabilities, netWorth };
}

module.exports = {
    addAsset,
    updateAsset,
    deleteAsset,
    getAssets,
    addLiability,
    updateLiability,
    deleteLiability,
    getLiabilities,
    getNetWorth
}; 