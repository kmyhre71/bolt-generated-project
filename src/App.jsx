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
          if (!url) {
            setLinks([{ url: 'Please enter a URL', status: 'Error' }]);
            return;
          }
          try {
            new URL(url);
          } catch (e) {
            setLinks([{ url: 'Invalid URL format', status: 'Error' }]);
            return;
          }

          const response = await fetch(`/api?url=${encodeURIComponent(url)}`);
          if (!response.ok) {
            setLinks([{ url: 'Error fetching URL', status: 'Error' }]);
            return;
          }
          const html = await response.text();

          const linkRegex = /<a.*?href=["'](.*?)(?=["'])(?:[^>]*>)/g;
          const extractedLinks = [];
          let match;
          while ((match = linkRegex.exec(html)) !== null) {
            extractedLinks.push(match[1]);
          }

          const initialLinks = extractedLinks.map(link => ({ url: link, status: 'Pending' }));
          setLinks(initialLinks);

          for (let i = 0; i < extractedLinks.length; i++) {
            const link = extractedLinks[i];
            try {
              const absoluteLink = new URL(link, url).href;
              const response = await axios.get(absoluteLink, {
                proxy: {
                  host: 'localhost',
                  port: 5174
                }
              });
              setLinks(prevLinks => {
                const newLinks = [...prevLinks];
                newLinks[i] = { ...newLinks[i], status: response.status };
                return newLinks;
              });
            } catch (error) {
              const status = error.response ? error.response.status : 'Error';
              console.error('Error validating link:', link, error);
              setLinks(prevLinks => {
                const newLinks = [...prevLinks];
                 newLinks[i] = { ...newLinks[i], status: status };
                return newLinks;
              });
            }
          }
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
                      {link.status === 'Pending' ? null : (
                        <span
                          className={`status-icon ${
                            link.status === 200 ? 'success' : 'error'
                          }`}
                        ></span>
                      )}
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
