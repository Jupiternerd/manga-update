import { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './dbPool.js';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core/index.js';
import authMiddleware from './authMiddleware.js';
import { AuthenticatedRequest } from '../src/types.js';

const client = new ApolloClient({
  uri: 'https://graphql.anilist.co',
  cache: new InMemoryCache(),
});

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  authMiddleware(req, res, async () => {
    const { mangaId } = req.body;
    const userId = req.userId;

    if (!mangaId) {
      return res.status(400).json({ error: 'Missing mangaId parameter' });
    }

    try {
      const clientDb = await pool.connect();

      // Check if the manga exists in the manga table
      let result = await clientDb.query('SELECT * FROM manga WHERE id = $1', [mangaId]);

      if (result.rows.length === 0) {
        // Fetch manga details from AniList
        const FETCH_MANGA = gql`
          query ($id: Int) {
            Media(id: $id, type: MANGA) {
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
              updatedAt
            }
          }
        `;

        const response = await client.query({
          query: FETCH_MANGA,
          variables: { id: parseInt(mangaId) },
        });

        const manga = response.data.Media;
        if (!manga) {
          throw new Error('Manga not found in AniList');
        }

        const title = manga.title.english || manga.title.romaji || manga.title.native;
        const coverUrl = manga.coverImage.large;
        const chapters = manga.chapters || 0;
        const lastUpdated = new Date(manga.updatedAt * 1000).toISOString(); // Convert timestamp to ISO string

        // Insert the manga into the manga table
        await clientDb.query(
          'INSERT INTO manga (id, title, cover_url, chapters, last_updated) VALUES ($1, $2, $3, $4, $5)',
          [manga.id, title, coverUrl, chapters, lastUpdated]
        );
      }

      // Check if the user already follows this manga
      result = await clientDb.query('SELECT * FROM user_manga WHERE user_id = $1 AND manga_id = $2', [userId, mangaId]);

      if (result.rows.length > 0) {
        res.status(400).json({ message: 'You already follow this manga.' });
        return;
      }

      // Add manga to user_manga table
      await clientDb.query('INSERT INTO user_manga (user_id, manga_id) VALUES ($1, $2)', [userId, mangaId]);

      // Increment follower count for the manga
      await clientDb.query('UPDATE manga SET follower_count = follower_count + 1 WHERE id = $1', [mangaId]);

      res.status(201).json({ message: 'Manga followed successfully.' });
    } catch (error) {
      console.error('Error following manga:', error);
      res.status(500).json({ error: 'Error following manga' });
    }
  });
}
