import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core/index.js';

const client = new ApolloClient({
  uri: 'https://graphql.anilist.co',
  cache: new InMemoryCache(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const POPULAR_MANGA = gql`
    query {
      Page(perPage: 10) {
        media(sort: POPULARITY_DESC, type: MANGA) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
        }
      }
    }
  `;

  try {
    const response = await client.query({
      query: POPULAR_MANGA,
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data from AniList:', error);
    res.status(500).json({ error: 'Error fetching data from AniList' });
  }
}
