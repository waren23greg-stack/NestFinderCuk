export default async function handler(req, res) {
  const { method, headers } = req;
  
  // Extract the path after /api/nest (e.g., /listings, /listings?filters)
  const pathWithQuery = req.url.replace('/api/nest', '') || '/';
  const backendUrl = `https://media-storage-advanced.onrender.com/nest${pathWithQuery}`;
  
  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Forward Authorization header if present
    if (headers.authorization) {
      fetchOptions.headers['Authorization'] = headers.authorization;
    }
    
    // Forward request body for POST/PATCH/PUT
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
