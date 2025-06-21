#!/usr/bin/env node

/**
 * Test Script for NestJS API Service
 * Tests all major endpoints and functionality
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Test data
const testUserId = 'test-user-123';
const testEmotionData = {
  dominantEmotion: 'happy',
  confidence: 0.85,
  emotions: {
    happy: 0.85,
    sad: 0.10,
    neutral: 0.05
  }
};

async function testAPI() {
  console.log('🧪 Starting NestJS API Tests...\n');
  console.log(`📍 Testing API at: ${API_BASE_URL}\n`);

  try {
    // Test 1: Health Check
    console.log('1. 🔍 Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Health check passed:', healthResponse.status);

    // Test 2: Record emotion
    console.log('\n2. 📊 Testing Emotion Recording...');
    const emotionResponse = await axios.post(`${API_BASE_URL}/emotions/record`, {
      userId: testUserId,
      emotionData: testEmotionData,
      pageUrl: 'http://test-page.com'
    });
    console.log('✅ Emotion recorded:', emotionResponse.status);

    // Test 3: Get emotion history
    console.log('\n3. 📈 Testing Emotion History...');
    const historyResponse = await axios.get(`${API_BASE_URL}/emotions/history/${testUserId}`);
    console.log('✅ Emotion history retrieved:', historyResponse.data.length, 'records');

    // Test 4: Get emotion stats
    console.log('\n4. 📊 Testing Emotion Stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/emotions/stats/${testUserId}`);
    console.log('✅ Emotion stats retrieved:', Object.keys(statsResponse.data.emotionCounts).length, 'emotions');

    // Test 5: Get all products
    console.log('\n5. 🛍️ Testing Product Listing...');
    const productsResponse = await axios.get(`${API_BASE_URL}/products`);
    console.log('✅ Products retrieved:', productsResponse.data.length, 'products');

    // Test 6: Get product recommendations
    console.log('\n6. 🎯 Testing Product Recommendations...');
    const recommendationsResponse = await axios.post(`${API_BASE_URL}/recommendations/products`, {
      userId: testUserId,
      currentEmotion: testEmotionData
    });
    console.log('✅ Product recommendations:', recommendationsResponse.data.products.length, 'products');
    console.log('   Reasoning:', recommendationsResponse.data.reasoning);

    // Test 7: Get category recommendations
    console.log('\n7. 🏷️ Testing Category Recommendations...');
    const categoryResponse = await axios.post(`${API_BASE_URL}/recommendations/predict-preferences`, {
      userId: testUserId,
      currentEmotion: testEmotionData
    });
    console.log('✅ Category recommendations:', categoryResponse.data.recommendedCategories.length, 'categories');

    // Test 8: Get user insights
    console.log('\n8. 🔍 Testing User Insights...');
    const insightsResponse = await axios.get(`${API_BASE_URL}/recommendations/user/${testUserId}/insights`);
    console.log('✅ User insights:', insightsResponse.data.insights.length, 'insights');

    // Test 9: Get personalized recommendations
    console.log('\n9. 👤 Testing Personalized Recommendations...');
    const personalizedResponse = await axios.get(`${API_BASE_URL}/recommendations/user/${testUserId}?limit=5`);
    console.log('✅ Personalized recommendations:', personalizedResponse.data.products.length, 'products');

    // Test 10: Get trending by emotion
    console.log('\n10. 📊 Testing Trending by Emotion...');
    const trendingResponse = await axios.get(`${API_BASE_URL}/recommendations/trending/happy?limit=3`);
    console.log('✅ Trending products:', trendingResponse.data.products.length, 'products');

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Health check');
    console.log('- ✅ Emotion recording');
    console.log('- ✅ Emotion history');
    console.log('- ✅ Emotion statistics');
    console.log('- ✅ Product listing');
    console.log('- ✅ Product recommendations');
    console.log('- ✅ Category recommendations');
    console.log('- ✅ User insights');
    console.log('- ✅ Personalized recommendations');
    console.log('- ✅ Trending by emotion');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
