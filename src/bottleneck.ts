import axios from 'axios';
import Bottleneck from 'bottleneck';

// Create a Bottleneck instance to rate limit requests
const limiter = new Bottleneck({
  minTime: 200, // Minimum time between requests to ensure 5 requests per second
  maxConcurrent: 1, // Only one request at a time
});

export async function fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 300) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      console.log(`Attempt ${attempt + 1} to fetch ${url}`);
      const response = await limiter.schedule(() => axios({ url, timeout: 10000, ...options }));
      return response.data;
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
      if (attempt < retries - 1) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, backoff * attempt));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
}
