const { createClient } = require('@sanity/client');

// Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  useCdn: true,
  apiVersion: '2024-01-01'
});

const sanityPersonId = 'k2r2aa8vmghuyr3he0p2eo5e'; // memelord

async function testSanityImport() {
  console.log('🔍 Testing Sanity import for memelord...');
  console.log('  Person ID:', sanityPersonId);
  console.log('  Project:', process.env.SANITY_PROJECT_ID || 'a9vtdosx');
  console.log('  Dataset:', process.env.SANITY_DATASET || 'production');
  console.log('  Token configured:', !!process.env.SANITY_API_TOKEN);
  
  try {
    // First, verify the person exists
    const personQuery = `*[_id == "${sanityPersonId}"][0] {
      _id,
      _type,
      name,
      username,
      email
    }`;
    
    const person = await sanityClient.fetch(personQuery);
    console.log('\n📋 Person found:', person ? 'Yes' : 'No');
    if (person) {
      console.log('  Name:', person.name || person.username);
      console.log('  Type:', person._type);
    }
    
    // Now check for products/designs
    console.log('\n🔍 Searching for designs...');
    
    // Try multiple query variations
    const queries = [
      {
        name: 'Direct creator reference',
        query: `*[_type == "product" && creator._ref == "${sanityPersonId}"]`
      },
      {
        name: 'Creators array reference',
        query: `*[_type == "product" && "${sanityPersonId}" in creators[]._ref]`
      },
      {
        name: 'General reference',
        query: `*[_type == "product" && references("${sanityPersonId}")]`
      },
      {
        name: 'Combined query (used in import)',
        query: `*[_type == "product" && (references("${sanityPersonId}") || "${sanityPersonId}" in creators[]._ref)]`
      }
    ];
    
    for (const { name, query } of queries) {
      const results = await sanityClient.fetch(query + ' {_id, title}');
      console.log(`\n  ${name}:`);
      console.log(`    Found: ${results.length} designs`);
      if (results.length > 0) {
        console.log('    First few titles:');
        results.slice(0, 3).forEach(r => console.log(`      - ${r.title}`));
      }
    }
    
    // Get a sample of all products to understand the structure
    console.log('\n📊 Sample product structure:');
    const sampleProduct = await sanityClient.fetch(`*[_type == "product"][0] {
      _id,
      title,
      creator,
      creators,
      "creatorType": _type
    }`);
    
    if (sampleProduct) {
      console.log('  Sample product:', sampleProduct.title);
      console.log('  Creator field:', JSON.stringify(sampleProduct.creator, null, 2));
      console.log('  Creators field:', JSON.stringify(sampleProduct.creators, null, 2));
    }
    
    // Check if memelord has any designs with a broader search
    console.log('\n🔍 Broader search for memelord content...');
    const textSearch = await sanityClient.fetch(`*[_type == "product" && (title match "memelord*" || description match "memelord*")] {
      _id,
      title
    }`);
    console.log(`  Text search for "memelord": ${textSearch.length} results`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('  Details:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

testSanityImport();