const axios = require('axios');

// Function to fetch manga search results
const fetchManga = async (query) => {
  try {
    const response = await axios.get(`https://api.mangadex.org/manga`, {
      params: { title: query, limit: 10 },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Manga search results:', response.data);
  } catch (error) {
    console.error('Error fetching manga search results:', error);
  }
};

// Function to fetch cover URL
const fetchCoverUrl = async (coverId) => {
  try {
    const response = await axios.get(`https://api.mangadex.org/cover/${coverId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Cover URL data:', response.data);
    const coverData = response.data.data[0];
    if (coverData) {
      const coverUrl = `https://uploads.mangadex.org/covers/${coverData.relationships[0].id}/${coverData.attributes.fileName}`;
      console.log('Cover URL:', coverUrl);
    } else {
      console.log('No cover data found');
    }
  } catch (error) {
    console.error('Error fetching cover URL:', error);
  }
};

// Test fetching manga search results
fetchManga('b');

// Test fetching cover URL
// Replace 'coverId' with an actual cover ID from the search results or any known cover ID
fetchCoverUrl('4265c437-7d57-4d31-9b1d-0e574a07b7b7');
