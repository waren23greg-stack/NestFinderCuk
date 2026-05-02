export default async function handler(req, res) {
  const { method, headers, query } = req;
  
  const pathSegments = query.path || [];
  const path = '/' + pathSegments.join('/');
  
  const queryString = new URLSearchParams(req.query).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  
  const backendUrl = `https://media-storage-advanced.onrender.com/auth${fullPath}`;
  
  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (headers.authorization) {
      fetchOptions.headers['Authorization'] = headers.authorization;
    }
    
    if (req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
