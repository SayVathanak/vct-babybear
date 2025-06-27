import { NextResponse } from "next/server";
import axios from 'axios';
import pRetry from 'p-retry';
import pTimeout from 'p-timeout';
import * as cheerio from 'cheerio';

// Use a more robust HTTP client with better defaults
const httpClient = axios.create({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },
  maxRedirects: 3
});

// Enhanced cache with LRU eviction and memory management
class LRUCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new LRUCache(1000);
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const NEGATIVE_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const REQUEST_TIMEOUT = 6000;

// --- Enhanced Validation ---
function validateBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { valid: false, error: 'Barcode is required and must be a string.' };
  }
  
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  if (cleanBarcode.length < 8 || cleanBarcode.length > 18) {
    return { valid: false, error: 'Barcode must be between 8 and 18 digits.' };
  }

  // Basic checksum validation for common barcode types
  if (cleanBarcode.length === 13 && !isValidEAN13(cleanBarcode)) {
    return { valid: false, error: 'Invalid EAN-13 barcode checksum.' };
  }

  return { valid: true, cleanBarcode };
}

function isValidEAN13(barcode) {
  if (barcode.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(barcode[12]);
}

function getCacheKey(barcode) {
  return `product_v7_${barcode}`;
}

function isCacheValid(cacheEntry) {
  const duration = cacheEntry.data === null ? NEGATIVE_CACHE_DURATION : CACHE_DURATION;
  return Date.now() - cacheEntry.timestamp < duration;
}

// --- Enhanced Product Information Extraction ---
function extractProductInfo(title, url = '') {
  // Remove common retailer suffixes and noise
  let name = title
    .replace(/(\s*[-|–]\s*(Amazon|Walmart|eBay|Target|Best Buy|Costco|Home Depot).*)/i, '')
    .replace(/\s*\|\s*.*/i, '') // Remove everything after pipe
    .replace(/\s*-\s*\d+.*$/i, '') // Remove trailing numbers
    .trim();

  // Extract brand - improved logic
  const brandPatterns = [
    /^([A-Za-z0-9&\s]{2,25}?)\s+[-–]/, // Brand followed by dash
    /^([A-Za-z0-9&\s]{2,25}?)\s+\|/, // Brand followed by pipe
    /^([A-Z][a-zA-Z0-9&\s]{1,24}?)\s+[A-Z]/, // Capitalized brand followed by another cap word
  ];

  let brand = '';
  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match) {
      brand = match[1].trim();
      break;
    }
  }

  // Fallback: use first word as brand
  if (!brand) {
    brand = name.split(/\s+/)[0];
  }

  return { name, brand };
}

function getCleanDescription(searchResult) {
  const metatags = searchResult.pagemap?.metatags?.[0];
  
  if (metatags) {
    const descriptions = [
      metatags['og:description'],
      metatags['twitter:description'],
      metatags['description']
    ];
    
    for (const desc of descriptions) {
      if (desc && desc.length > 30 && desc.length < 500) {
        return desc.trim();
      }
    }
  }
  
  const snippet = searchResult.snippet;
  return (snippet && snippet.length > 20) ? snippet.trim() : null;
}

// --- Enhanced Image Search with Better Scoring ---
async function fetchProductImage(productName, brand, apiKey, searchEngineId) {
  try {
    const query = `${productName} ${brand} product -review -blog -ebay`;
    
    const response = await pTimeout(
      httpClient.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          searchType: 'image',
          imgSize: 'large',
          safe: 'active',
          num: 8,
          imgType: 'photo'
        }
      }),
      { milliseconds: REQUEST_TIMEOUT }
    );

    if (!response.data.items?.length) return null;

    const scoredImages = response.data.items.map(img => {
      let score = 0;
      const contextLink = (img.image.contextLink || '').toLowerCase();
      const title = (img.title || '').toLowerCase();
      
      // Trusted domains
      const trustedDomains = ['amazon.com', 'walmartimages.com', 'target.com', 'bestbuy.com'];
      if (trustedDomains.some(domain => contextLink.includes(domain))) score += 5;
      
      // Avoid untrusted sources
      const untrustedSources = ['ebay.com', 'aliexpress', 'wish.com', 'pinterest', 'blog'];
      if (untrustedSources.some(source => contextLink.includes(source))) score -= 10;
      
      // Avoid irrelevant images
      const badKeywords = ['hand', 'person', 'review', 'unboxing', 'comparison'];
      if (badKeywords.some(keyword => title.includes(keyword))) score -= 5;
      
      // Prefer good aspect ratios (not too wide or tall)
      if (img.image.width && img.image.height) {
        const aspectRatio = img.image.width / img.image.height;
        if (aspectRatio >= 0.6 && aspectRatio <= 1.6) score += 3;
        
        // Prefer larger images
        const size = img.image.width * img.image.height;
        if (size > 50000) score += 2;
      }
      
      // Brand relevance
      if (brand && title.includes(brand.toLowerCase())) score += 2;
      
      return { url: img.link, score, width: img.image.width, height: img.image.height };
    });

    scoredImages.sort((a, b) => b.score - a.score);
    return scoredImages[0]?.score >= 0 ? scoredImages[0].url : null;

  } catch (error) {
    console.error("Image search failed:", error.message);
    return null;
  }
}

// --- Enhanced Web Scraping with Better Selectors ---
async function scrapeProductPage(url) {
  try {
    console.log(`Scraping: ${url}`);
    
    const response = await pTimeout(
      httpClient.get(url),
      { milliseconds: REQUEST_TIMEOUT }
    );
    
    const $ = cheerio.load(response.data);
    const result = { description: null, ingredients: null, specifications: null };

    // Enhanced description selectors with priority
    const descriptionSelectors = [
      // OpenFoodFacts specific
      '#description',
      '.description',
      '[data-tab="description"]',
      '#product-description',
      
      // UPCItemDB specific
      '.product-description',
      '#product_description',
      '.description-text',
      
      // Amazon specific
      '#feature-bullets ul',
      '[data-cel-widget="feature-bullets"] ul',
      '#productDescription',
      
      // Walmart specific
      '[data-automation-id="product-highlights"]',
      '[data-testid="product-description"]',
      
      // Target specific
      '[data-test="item-details-description"]',
      
      // Generic selectors
      '.ProductDescription',
      '[data-cy="product-description"]',
      '.product-info',
      '.product-details'
    ];
    
    for (const selector of descriptionSelectors) {
      const element = $(selector);
      if (element.length) {
        let text = element.text().trim();
        
        // Clean up the text
        text = text.replace(/\s+/g, ' ').trim();
        
        // Quality checks
        if (text.length > 50 && text.length < 2000) {
          const badKeywords = [
            'customers also viewed', 'bought with', 'customer reviews',
            'frequently bought together', 'sponsored products'
          ];
          
          if (!badKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
            result.description = text;
            break;
          }
        }
      }
    }

    // Enhanced ingredients detection
    const ingredientsSelectors = [
      // OpenFoodFacts specific
      '#panel_ingredients_content',
      '.ingredients-list',
      '[data-tab="ingredients"]',
      
      // Generic ingredients
      'h2:contains("Ingredients"), h3:contains("Ingredients"), h4:contains("Ingredients")',
      'strong:contains("Ingredients"), b:contains("Ingredients")',
      '[data-testid="ingredients"]',
      '.ingredients',
      '#ingredients'
    ];
    
    for (const selector of ingredientsSelectors) {
      const header = $(selector).filter((i, el) => 
        $(el).text().trim().toLowerCase().includes('ingredient')
      ).first();
      
      if (header.length) {
        let ingredientsText = header.next().text() || 
                             header.parent().next().text() ||
                             header.siblings().text();
        
        if (ingredientsText) {
          ingredientsText = ingredientsText
            .replace(/ingredients?:?\s*/i, '')
            .trim();
          
          // Validate ingredients format
          const ingredientKeywords = ['water', 'sugar', 'salt', 'contains', 'may contain'];
          if (ingredientsText.length > 10 && 
              ingredientKeywords.some(kw => ingredientsText.toLowerCase().includes(kw))) {
            result.ingredients = ingredientsText;
            break;
          }
        }
      }
    }

    console.log('Scraping result:', result);
    return result;

  } catch (error) {
    console.error(`Scraping failed for ${url}:`, error.message);
    return null;
  }
}

// --- Multiple API Sources ---
async function searchWithRetry(query, apiKey, searchEngineId) {
  return await pRetry(
    async () => {
      const response = await pTimeout(
        httpClient.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: query,
            num: 8,
            safe: 'active'
          }
        }),
        { milliseconds: REQUEST_TIMEOUT }
      );
      
      if (!response.data.items?.length) {
        throw new Error('No search results found');
      }
      
      return response.data.items;
    },
    {
      retries: 2,
      minTimeout: 500,
      maxTimeout: 2000,
      factor: 2,
      onFailedAttempt: error => {
        console.log(`Search attempt failed: ${error.message}`);
      }
    }
  );
}

// --- Main API Handler ---
export async function GET(request, { params }) {
  const startTime = Date.now();
  
  try {
    const { barcode } = await params;
    const validation = validateBarcode(barcode);
    
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }
    
    const cleanBarcode = validation.cleanBarcode;
    const cacheKey = getCacheKey(cleanBarcode);

    // Check cache
    if (cache.has(cacheKey)) {
      const cacheEntry = cache.get(cacheKey);
      if (isCacheValid(cacheEntry)) {
        const processingTime = Date.now() - startTime;
        
        if (cacheEntry.data === null) {
          return NextResponse.json(
            { success: false, message: 'Product not found (cached)', processingTime },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          product: cacheEntry.data,
          cached: true,
          processingTime
        });
      }
    }
    
    // Validate environment
    const API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      return NextResponse.json(
        { success: false, message: 'Search service not configured' },
        { status: 503 }
      );
    }

    console.log(`Starting lookup for barcode: ${cleanBarcode}`);

    // Multiple search strategies
    const searchQueries = [
      `"${cleanBarcode}" product`,
      `barcode ${cleanBarcode}`,
      `UPC ${cleanBarcode} product`
    ];

    let searchResults = [];
    for (const query of searchQueries) {
      try {
        searchResults = await searchWithRetry(query, API_KEY, SEARCH_ENGINE_ID);
        if (searchResults.length > 0) break;
      } catch (error) {
        console.log(`Query "${query}" failed:`, error.message);
        continue;
      }
    }

    if (!searchResults.length) {
      cache.set(cacheKey, { data: null, timestamp: Date.now() });
      return NextResponse.json(
        { success: false, message: 'Product not found in search results' },
        { status: 404 }
      );
    }

    // Extract product information
    const bestResult = searchResults[0];
    const { name, brand } = extractProductInfo(bestResult.title, bestResult.link);
    
    const product = {
      name,
      brand,
      description: getCleanDescription(bestResult),
      imageUrl: null,
      sourceUrl: bestResult.link,
      ingredients: null,
      barcode: cleanBarcode
    };

    // Parallel operations for better performance
    const [scrapedData, imageUrl] = await Promise.allSettled([
      scrapeProductPage(product.sourceUrl),
      fetchProductImage(product.name, product.brand, API_KEY, SEARCH_ENGINE_ID)
    ]);

    // Apply scraped data if successful
    if (scrapedData.status === 'fulfilled' && scrapedData.value) {
      if (scrapedData.value.description) {
        product.description = scrapedData.value.description;
      }
      if (scrapedData.value.ingredients) {
        product.ingredients = scrapedData.value.ingredients;
      }
    }

    // Apply image URL if successful
    if (imageUrl.status === 'fulfilled' && imageUrl.value) {
      product.imageUrl = imageUrl.value;
    } else {
      // Fallback to search result image
      product.imageUrl = bestResult.pagemap?.cse_image?.[0]?.src || null;
    }

    // Ensure we have a description
    if (!product.description) {
      product.description = bestResult.snippet || 'No description available';
    }

    const processingTime = Date.now() - startTime;
    product.processingTime = processingTime;

    // Cache the result
    cache.set(cacheKey, { data: product, timestamp: Date.now() });

    console.log(`Lookup completed in ${processingTime}ms for barcode: ${cleanBarcode}`);

    return NextResponse.json({
      success: true,
      product,
      cached: false,
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        processingTime
      },
      { status: 500 }
    );
  }
}