export default async function handler(req, res) {
  const { query, body, method, headers } = req;
  
  // Extract the path after /api/nest
  const path = req.url.replace('/api/nest', '');
  const backendUrl = `https://media-storage-advanced.onrender.com/nest${path}`;
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers.authorization && { Authorization: headers.authorization })
      }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(backendUrl, options);
    const data = await response.json();
    
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
