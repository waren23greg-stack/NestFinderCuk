export default async function handler(req, res) {
  try {
    const pathSegments = req.query.path || [];
    const path = '/' + pathSegments.join('/');
    
    const queryString = new URLSearchParams(req.query).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    
    const backendUrl = `https://media-storage-advanced.onrender.com/nest${fullPath}`;
    
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}
