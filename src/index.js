
// Imports

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require('jsonwebtoken'); 
const bcrypt = require("bcrypt");   
require('dotenv').config()



// Arracar el servidor

const server = express();

// Configuración del servidor

server.use(cors());
server.use(express.json({limit: "25mb"}));




// Conexion a la base de datos

async function getConnection() {
  const connection = await mysql.createConnection(
    {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS,  // <-- Pon aquí tu contraseña o en el fichero /.env en la carpeta raíz
      database: process.env.DB_NAME || "Clase",
    }
  );

  connection.connect();

  return connection;
}



// Poner a escuchar el servidor

const port = process.env.PORT || 4500;
server.listen(port, () => {
  console.log(`Ya se ha arrancado nuestro servidor: http://localhost:${port}/`);
});

// ENDPOINTS  

// 1.GET /recetas,  mostrar toda la tabla

server.get("/recetas", async (req, res) => {
  const select= "SELECT * FROM recetas"
  const conn = await getConnection();

  try{
    const [result] = await conn.query(select);
    console.log(result);
    conn.end();
    res.json(
      {
        info: {
            count: result.lenght, 
        },
        results: result 
    }
    );
  } catch (error) {
    res.json (   {
      success: false, 
      message:error,
    })
  }
});


//2. GET/recetas/:id busca la receta por id

server.get("/recetas/:id", async (req, res) => {

  const id= req.params.id;
  const select = "SELECT * FROM recetas where id = ?";
  const conn = await getConnection();

  try {
    const [result] = await conn.query(select, id);
    console.log(result);
    conn.end();
    res.json(
      {
        info: {
            count: result.lenght, 
        },
        results: result 
    }
    );
  } catch (error) {
    console.error(error);
    
    res.json (   {
      success: false, 
      message:error,
    })
  }
  
});

//3.añadir nueva receta /receta/:nombre
server.post("/recetas", async (req, res) => {

  const nombre= req.params.nombre;
  const newRecipe = req.body;

  try{
    const insert = "insert into recetas (nombre, ingredientes, instrucciones) values(?,?,?)";
    const conn = await getConnection();

    const [result] = await conn.query(insert, [ 
      newRecipe.nombre, 
      newRecipe.ingredientes, 
      newRecipe.instrucciones     
    ]);
  conn.end();
  res.json(     {
    success: true, 
    "id": result.insertId, 
  }
  );
  } catch (error) {
    res.json (   {
      success: false, 
      message:"error no se ha podido añadir esta información a su tabla",
    })
  }
});

////4. actualizar receta receta/:id

server.put("/recetas/:id", async (req, res) => {


  const id = req.params.id;
  
  const newRecipe = req.body;
  try {
    const update = "UPDATE recetas SET nombre= ?, ingredientes= ?, instrucciones= ? WHERE id= ?";
    const conn = await getConnection();
    const [result] = await conn.query(update, 
      [ newRecipe.nombre, 
        newRecipe.ingredientes, 
        newRecipe.instrucciones, 
        id]);
    conn.end()
    console.log(result)
    res.json({
      success:true
      
    });
  }
  catch (error) {
    res.json({
      success:false,
      message:"Ha ocurrido un error al actualizar la receta"
    })
  }

}); 

//4.ELIMINAR RECETA recetas/:id
server.delete("/recetas/:id", async (req, res) => {
  
  const  id = req.params.id;

  
  try {
    const deleteSql = "DELETE from recetas where id = ? ";
    const conn = await getConnection();
    const [result] = await conn.query(deleteSql, id);
    conn.end()
    res.json(
      {
        succes:true,
      }
    );
  }
  catch (error) {
    res.json({
      success:false,
      message:error,
    })
  }

});


////BONUS
//GENERAR Y VERIFICAR TOKEN

const generateToken = (payload) => {
  const token = jwt.sign(payload, 'secreto', { expiresIn: '1h' });
    return token;
  };
  
  const verifyToken = (token) => {
    try {
      const decoded = jwt.verify(token, 'secreto');
      return decoded;
    } catch (err) {
      return { error: "Token inválido" };
    }
  };

  const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
  
    const decoded = verifyToken(token);
  
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  
    req.user = decoded;
    next();
  };
  
  
//AUTENTIFICACIÓN JWT registro y inicio de sesión


server.post('/registro' , async (req,res) => {
  const nombre = req.body.nombre;
  const email = req.body.email;
  const password = req.body.password;
  
  
  const passwordHash = await bcrypt.hash(password, 10);

  let sql = "INSERT INTO usuarios (nombre,email,password) VALUES (?,?,?)";
  let user = {
    nombre: nombre,
    email: email,
    passwordHash: passwordHash,
  };

  jwt.sign(user, "secreto", async (err, token)=> {
    if(err){
      res.status(400).send({msg : 'Error'})
   } else {
    const connection = await getConnection();
    const [results, fields] = await connection.query(sql,[
      nombre,
      email,
      passwordHash,
    ]);
    connection.end();
    res.json({msg:'success', token: token, id:results.insertId})
    }
  })

});