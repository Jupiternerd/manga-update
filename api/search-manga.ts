import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core/index.js';

const client = new ApolloClient({
  uri: 'https://graphql.anilist.co',
  cache: new InMemoryCache(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { query } = req.query;
  
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid query parameter' });
    }
  
    const SEARCH_MANGA = gql`
      query ($search: String) {
        Page(perPage: 5) {
          media(search: $search, type: MANGA) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
            }
            chapters
          }
        }
      }
    `;
  
    try {
      const response = await client.query({
        query: SEARCH_MANGA,
        variables: { search: query },
      });
  
      const mangaList = response.data.Page.media;
      res.status(200).json(mangaList);
    } catch (error) {
      console.error('Error fetching data from AniList:', error);
      res.status(500).json({ error: 'Error fetching data from AniList' });
    }
  }
