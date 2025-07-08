// Test script for ETF refresh functionality
const fetch = require('node-fetch');

async function testEtfRefresh() {
  console.log('🧪 Testing ETF Refresh Functionality...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Test 1: Check current ETFs in database
    console.log('1. Checking current ETFs in database...');
    const etfResponse = await fetch(`${baseUrl}/api/etfs?page=1&limit=5`);
    const etfData = await etfResponse.json();
    
    if (etfResponse.ok) {
      console.log(`✅ Current ETFs: Found ${etfData.total} total, showing ${etfData.etfs.length} on page ${etfData.page}`);
      if (etfData.etfs && etfData.etfs.length > 0) {
        console.log('📋 Sample ETFs:');
        etfData.etfs.slice(0, 3).forEach(etf => {
          console.log(`   - ${etf.symbol}: ${etf.name} (${etf.exchange})`);
        });
      }
    } else {
      console.log(`❌ ETFs Error: ${etfData.error}`);
    }
    
    // Test 2: Trigger ETF refresh from FMP API
    console.log('\n2. Triggering ETF refresh from Financial Modeling Prep API...');
    const refreshResponse = await fetch(`${baseUrl}/api/etfs/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const refreshData = await refreshResponse.json();
    
    if (refreshResponse.ok) {
      console.log(`✅ ETF Refresh: ${refreshData.message}`);
      console.log(`   - Refreshed ${refreshData.count} ETFs`);
      console.log(`   - Timestamp: ${refreshData.timestamp}`);
    } else {
      console.log(`❌ ETF Refresh Error: ${refreshData.error}`);
    }
    
    // Test 3: Check ETFs after refresh
    console.log('\n3. Checking ETFs after refresh...');
    const etfResponse2 = await fetch(`${baseUrl}/api/etfs?page=1&limit=5`);
    const etfData2 = await etfResponse2.json();
    
    if (etfResponse2.ok) {
      console.log(`✅ Updated ETFs: Found ${etfData2.total} total, showing ${etfData2.etfs.length} on page ${etfData2.page}`);
      if (etfData2.etfs && etfData2.etfs.length > 0) {
        console.log('📋 Sample ETFs after refresh:');
        etfData2.etfs.slice(0, 3).forEach(etf => {
          console.log(`   - ${etf.symbol}: ${etf.name} (${etf.exchange})`);
        });
      }
    } else {
      console.log(`❌ Updated ETFs Error: ${etfData2.error}`);
    }
    
    // Test 4: Test pagination
    console.log('\n4. Testing pagination...');
    const page2Response = await fetch(`${baseUrl}/api/etfs?page=2&limit=3`);
    const page2Data = await page2Response.json();
    
    if (page2Response.ok) {
      console.log(`✅ Page 2: Showing ${page2Data.etfs.length} ETFs on page ${page2Data.page} of ${page2Data.totalPages}`);
      if (page2Data.etfs && page2Data.etfs.length > 0) {
        console.log('📋 Page 2 ETFs:');
        page2Data.etfs.forEach(etf => {
          console.log(`   - ${etf.symbol}: ${etf.name}`);
        });
      }
    } else {
      console.log(`❌ Page 2 Error: ${page2Data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEtfRefresh(); 