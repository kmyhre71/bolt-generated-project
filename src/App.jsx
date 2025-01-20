import React, { useState } from 'react';
    import axios from 'axios';

    function App() {
      const [url, setUrl] = useState('');
      const [links, setLinks] = useState([]);
      const [loading, setLoading] = useState(false);

      const validateLinks = async () => {
        setLoading(true);
        setLinks([]);
        try {
          const response = await axios.get(url);
          const html = response.data;
          const linkRegex = /<a.*?href=["'](.*?)["'].*?>/g;
          const extractedLinks = [];
          let match;
          while ((match = linkRegex.exec(html)) !== null) {
            extractedLinks.push(match[1]);
          }

          const validatedLinks = await Promise.all(
            extractedLinks.map(async (link) => {
              try {
                const absoluteLink = new URL(link, url).href;
                const response = await axios.get(absoluteLink);
                return { url: absoluteLink, status: response.status, isExternal: new URL(absoluteLink).origin !== new URL(url).origin };
              } catch (error) {
                const status = error.response ? error.response.status : 'Error';
                return { url: link, status: status, isExternal: new URL(link, url).origin !== new URL(url).origin };
              }
            })
          );

          const externalLinks = validatedLinks.filter(link => link.isExternal);
          const internalLinks = validatedLinks.filter(link => !link.isExternal);

          setLinks([...externalLinks, ...internalLinks]);
        } catch (error) {
          console.error('Error fetching URL:', error);
          setLinks([{ url: 'Error fetching URL', status: 'Error' }]);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="container">
          <h1>Link Validator</h1>
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button onClick={validateLinks} disabled={loading}>
              {loading ? 'Validating...' : 'Validate'}
            </button>
          </div>
          {links.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>URL</th>
                  <th>HTTP Code</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link, index) => (
                  <tr key={index}>
                    <td>
                      <span
                        className={`status-icon ${
                          link.status === 200 ? 'success' : 'error'
                        }`}
                      ></span>
                    </td>
                    <td>{link.url}</td>
                    <td>{link.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    export default App;
