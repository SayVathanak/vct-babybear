// app/api/product/lookup/[barcode]/route.js

import axios from 'axios';

// In-memory cache (consider Redis for production)
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const NEGATIVE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for failed lookups

// Error types for better error handling
const ERROR_TYPES = {
  INVALID_BARCODE: 'INVALID_BARCODE',
  API_LIMIT_EXCEEDED: 'API_LIMIT_EXCEEDED',
  API_CREDENTIALS_MISSING: 'API_CREDENTIALS_MISSING',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Helper functions
function getCacheKey(barcode) {
  return `product_${barcode}`;
}

function isCacheValid(cacheEntry, isNegativeResult = false) {
  const duration = isNegativeResult ? NEGATIVE_CACHE_DURATION : CACHE_DURATION;
  return Date.now() - cacheEntry.timestamp < duration;
}

function validateBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { valid: false, error: 'Barcode is required' };
  }
  
  // Remove any spaces or special characters
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  if (cleanBarcode.length < 8 || cleanBarcode.length > 18) {
    return { 
      valid: false, 
      error: 'Barcode must be between 8 and 18 digits long' 
    };
  }
  
  // Basic UPC/EAN validation could be added here
  return { valid: true, cleanBarcode };
}

function extractProductInfoFromSnippet(snippet, title) {
  // Extract brand from title (usually first word or before dash/hyphen)
  const brandMatch = title.match(/^([A-Za-z0-9]+)[\s\-\|]/);
  const brand = brandMatch ? brandMatch[1] : title.split(' ')[0];
  
  // Try to extract category from snippet or title
  const categoryKeywords = [
    'food', 'drink', 'beverage', 'snack', 'candy', 'chocolate', 'cereal', 
    'soap', 'shampoo', 'cosmetic', 'book', 'toy', 'electronics', 'clothing',
    'medicine', 'vitamin', 'supplement', 'health', 'beauty'
  ];
  
  const category = categoryKeywords.find(keyword => 
    snippet.toLowerCase().includes(keyword) || title.toLowerCase().includes(keyword)
  ) || 'General';
  
  return { brand, category };
}

function handleApiError(error, context) {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error?.message || error.message;
    
    switch (status) {
      case 400:
        return {
          type: ERROR_TYPES.INVALID_BARCODE,
          message: 'Invalid search parameters',
          userMessage: 'The barcode format appears to be invalid. Please check and try again.'
        };
      case 403:
        return {
          type: ERROR_TYPES.API_LIMIT_EXCEEDED,
          message: 'API quota exceeded',
          userMessage: 'Search limit reached. Please try again later.'
        };
      case 429:
        return {
          type: ERROR_TYPES.API_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded',
          userMessage: 'Too many requests. Please wait a moment and try again.'
        };
      default:
        return {
          type: ERROR_TYPES.NETWORK_ERROR,
          message: `API error: ${status} - ${message}`,
          userMessage: 'Unable to search for product. Please try again.'
        };
    }
  } else if (error.code === 'ECONNABORTED') {
    return {
      type: ERROR_TYPES.NETWORK_ERROR,
      message: 'Request timeout',
      userMessage: 'Search timed out. Please try again.'
    };
  } else {
    return {
      type: ERROR_TYPES.NETWORK_ERROR,
      message: `Network error: ${error.message}`,
      userMessage: 'Network connection issue. Please check your connection and try again.'
    };
  }
}

async function searchGoogleCustomSearch(barcode) {
  const API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    throw new Error(ERROR_TYPES.API_CREDENTIALS_MISSING);
  }
  
  try {
    // Add timeout and retry logic
    const axiosConfig = {
      timeout: 10000, // 10 second timeout
      params: {
        key: API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: `${barcode} product barcode`,
        num: 5,
        safe: 'active'
      }
    };
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', axiosConfig);
    
    if (response.data.items && response.data.items.length > 0) {
      // Filter out irrelevant results
      const relevantItems = response.data.items.filter(item => 
        item.title && item.snippet && 
        !item.title.toLowerCase().includes('barcode generator') &&
        !item.title.toLowerCase().includes('barcode scanner')
      );
      
      if (relevantItems.length === 0) {
        return null;
      }
      
      const item = relevantItems[0];
      const { brand, category } = extractProductInfoFromSnippet(item.snippet, item.title);
      
      // Try to get product image with better error handling
      let imageUrl = null;
      try {
        const imageResponse = await axios.get('https://www.googleapis.com/customsearch/v1', {
          timeout: 5000,
          params: {
            key: API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: `${barcode} product`,
            searchType: 'image',
            num: 1,
            safe: 'active',
            imgSize: 'medium',
            imgType: 'photo'
          }
        });
        
        if (imageResponse.data.items && imageResponse.data.items.length > 0) {
          imageUrl = imageResponse.data.items[0].link;
        }
      } catch (imageError) {
        console.warn('Could not fetch product image:', imageError.message);
        // Don't fail the entire request if image fetch fails
      }
      
      return {
        name: item.title.replace(/\s*[-|]\s*.*$/, '').trim(),
        description: item.snippet.substring(0, 200) + (item.snippet.length > 200 ? '...' : ''),
        imageUrl: imageUrl,
        brand: brand,
        category: category,
        confidence: 'medium', // Add confidence score
        source: 'google_search',
        sourceUrl: item.link
      };
    }
    
    return null;
  } catch (error) {
    const errorInfo = handleApiError(error, 'Google Custom Search');
    console.error('Google Custom Search error:', errorInfo);
    throw error;
  }
}

async function searchGoogleShopping(barcode) {
  const API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    return null;
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      timeout: 10000,
      params: {
        key: API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: `${barcode} buy product price shop`,
        num: 5,
        safe: 'active'
      }
    });
    
    if (response.data.items && response.data.items.length > 0) {
      // Look for shopping-related results with better scoring
      const shoppingSites = ['amazon', 'walmart', 'target', 'ebay', 'shop', 'store'];
      const shoppingKeywords = ['buy', 'price', 'purchase', 'order', '$'];
      
      const scoredItems = response.data.items.map(item => {
        let score = 0;
        const lowerTitle = item.title.toLowerCase();
        const lowerLink = item.link.toLowerCase();
        
        // Score based on shopping sites
        shoppingSites.forEach(site => {
          if (lowerLink.includes(site)) score += 2;
        });
        
        // Score based on shopping keywords
        shoppingKeywords.forEach(keyword => {
          if (lowerTitle.includes(keyword)) score += 1;
        });
        
        return { ...item, score };
      });
      
      // Sort by score and get the best result
      const bestItem = scoredItems.sort((a, b) => b.score - a.score)[0];
      
      if (bestItem && bestItem.score > 0) {
        const { brand, category } = extractProductInfoFromSnippet(bestItem.snippet, bestItem.title);
        
        return {
          name: bestItem.title.replace(/\s*[-|]\s*.*$/, '').trim(),
          description: bestItem.snippet.substring(0, 200) + (bestItem.snippet.length > 200 ? '...' : ''),
          imageUrl: null,
          brand: brand,
          category: category,
          confidence: 'low', // Shopping results are typically less reliable
          source: 'google_shopping',
          sourceUrl: bestItem.link
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Google Shopping search error:', error.message);
    return null;
  }
}

export async function GET(request, { params }) {
  const { barcode } = params;
  
  try {
    // Validate barcode
    const validation = validateBarcode(barcode);
    if (!validation.valid) {
      return Response.json({
        success: false,
        error: {
          type: ERROR_TYPES.INVALID_BARCODE,
          message: validation.error
        }
      }, { status: 400 });
    }
    
    const cleanBarcode = validation.cleanBarcode;
    const cacheKey = getCacheKey(cleanBarcode);
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cacheEntry = cache.get(cacheKey);
      const isNegativeResult = cacheEntry.data === null;
      
      if (isCacheValid(cacheEntry, isNegativeResult)) {
        console.log(`Returning cached ${isNegativeResult ? 'negative ' : ''}result for barcode:`, cleanBarcode);
        
        if (isNegativeResult) {
          return Response.json({
            success: false,
            error: {
              type: ERROR_TYPES.PRODUCT_NOT_FOUND,
              message: 'Product not found in our database'
            },
            suggestions: [
              'Double-check the barcode number',
              'Try scanning the barcode again',
              'Enter product details manually',
              'Contact support if this is a new product'
            ]
          }, { status: 404 });
        }
        
        return Response.json({
          success: true,
          product: cacheEntry.data,
          cached: true
        });
      } else {
        cache.delete(cacheKey);
      }
    }

    console.log('Searching for product with barcode:', cleanBarcode);
    
    let productData = null;
    let searchErrors = [];
    
    // Try Google Custom Search first
    try {
      productData = await searchGoogleCustomSearch(cleanBarcode);
    } catch (error) {
      const errorInfo = handleApiError(error, 'Google Custom Search');
      searchErrors.push(errorInfo);
      console.error('Google Custom Search failed:', errorInfo.message);
      
      // If it's a credentials or quota issue, return early
      if (error.message === ERROR_TYPES.API_CREDENTIALS_MISSING) {
        return Response.json({
          success: false,
          error: {
            type: ERROR_TYPES.API_CREDENTIALS_MISSING,
            message: 'Product search service is temporarily unavailable'
          }
        }, { status: 503 });
      }
    }
    
    // If no result from first search, try Google Shopping
    if (!productData) {
      try {
        productData = await searchGoogleShopping(cleanBarcode);
      } catch (error) {
        const errorInfo = handleApiError(error, 'Google Shopping');
        searchErrors.push(errorInfo);
        console.error('Google Shopping search failed:', errorInfo.message);
      }
    }

    if (productData) {
      // Cache the successful result
      cache.set(cacheKey, {
        data: productData,
        timestamp: Date.now()
      });

      console.log('Product found:', productData.name);
      
      return Response.json({
        success: true,
        product: productData
      });
    } else {
      // Cache negative result with shorter duration
      cache.set(cacheKey, {
        data: null,
        timestamp: Date.now()
      });
      
      console.log('Product not found for barcode:', cleanBarcode);
      
      // Provide helpful error message and suggestions
      return Response.json({
        success: false,
        error: {
          type: ERROR_TYPES.PRODUCT_NOT_FOUND,
          message: 'Product not found in our database'
        },
        suggestions: [
          'Verify the barcode is complete and readable',
          'Try scanning the barcode again in better lighting',
          'Check if the product is recently released',
          'Enter product details manually',
          'Contact support if you believe this is an error'
        ],
        searchAttempts: searchErrors.length > 0 ? searchErrors.length : 2
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Product lookup error:', error);
    
    // Don't expose internal errors to users
    return Response.json({
      success: false,
      error: {
        type: ERROR_TYPES.INTERNAL_ERROR,
        message: 'An unexpected error occurred while searching for the product'
      },
      suggestions: [
        'Please try again in a few moments',
        'Check your internet connection',
        'If the problem persists, contact support'
      ]
    }, { status: 500 });
  }
}