const express = require("express");
const app = express();
const PORT = 3001;

// Middleware pour parser le JSON
app.use(express.json());

// Base de données en mémoire
let users = [
  { id: 1, name: "Alice", email: "alice@test.com" },
  { id: 2, name: "Bob", email: "bob@test.com" },
];
let nextId = 3;

// API 1: GET /api/health - Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API 2: GET /api/users - Liste des utilisateurs
app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    count: users.length,
    data: users,
  });
});

// API 3: POST /api/users - Créer un utilisateur
app.post("/api/users", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: "Name and email are required",
    });
  }

  const newUser = { id: nextId++, name, email };
  users.push(newUser);

  res.status(201).json({
    success: true,
    data: newUser,
  });
});

// API 4: GET /api/users/:id - Récupérer un utilisateur
app.get("/api/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test App</title>
      <style>
        body { 
          font-family: Arial; 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px;
          background: #f5f5f5;
        }
        h1 { color: #333; }
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          margin: 5px;
          cursor: pointer;
          border-radius: 4px;
        }
        button:hover { background: #0056b3; }
        #result { 
          margin-top: 20px; 
          padding: 15px; 
          background: white;
          border-radius: 4px;
          min-height: 50px;
        }
      </style>
    </head>
    <body>
      <h1>🧪 Test App pour Specto</h1>
      <p>Une application minimale pour tester Specto CLI</p>
      
      <div>
        <button onclick="addItem()">Ajouter un élément</button>
        <button onclick="clearItems()">Effacer tout</button>
      </div>
      
      <div id="result"></div>
      
      <script>
        let count = 0;
        
        function addItem() {
          count++;
          const div = document.getElementById('result');
          div.innerHTML += '<p>✅ Élément ' + count + '</p>';
        }
        
        function clearItems() {
          count = 0;
          document.getElementById('result').innerHTML = '<p>🗑️ Tout effacé!</p>';
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`✅ App running on http://localhost:${PORT}`);
});
