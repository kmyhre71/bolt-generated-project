import express from 'express';
    import fetch from 'node-fetch';
    import cheerio from 'cheerio';
    import cors from 'cors';

    const app = express();
    const port = 3000;

    app.use(cors());
    app.use(express.json());

    app.get('/api/validate', async (req, res) => {
      const url = req.query.url;
      console.log('Received URL:', url);

      if (!url) {
        return res.status(400).send('URL is required');
      }

      try {
        console.log('Fetching HTML content...');
        const response = await fetch(url);
        if (!response.ok) {
          console.error('Failed to fetch HTML:', response.status, response.statusText);
          return res.status(response.status).send('Failed to fetch HTML');
        }
        const html = await response.text();
        console.log('HTML content fetched successfully.');

        const $ = cheerio.load(html);
        const links = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
            links.push(href);
          }
        });
        console.log('Extracted links:', links);

        const validatedLinks = await Promise.all(
          links.map(async (link) => {
            try {
              const absoluteLink = new URL(link, url).href;
              console.log('Validating link:', absoluteLink);
              const linkResponse = await fetch(absoluteLink);
              console.log('Link validation response:', linkResponse.status, linkResponse.statusText);
              return { url: absoluteLink, status: linkResponse.status };
            } catch (error) {
              console.error('Error validating link:', link, error);
              return { url: link, status: 'Error' };
            }
          })
        );

        console.log('Validated links:', validatedLinks);
        res.json(validatedLinks);
      } catch (error) {
        console.error('Error processing URL:', error);
        res.status(500).send('Error processing URL');
      }
    });

    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
