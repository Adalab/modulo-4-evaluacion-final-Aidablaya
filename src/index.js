// Servidor Express

// Para probar los ficheros estáticos del fronend, entrar en <http://localhost:4500/>
// Para probar el API, entrar en <http://localhost:4500/api/items>

// Imports

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require('dotenv').config()



// Arracar el servidor

const server = express();

// Configuración del servidor

server.use(cors());
server.use(express.json({limit: "25mb"}));
//server.set('view engine', 'ejs');



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

server.get("/api/recetas", async (req, res) => {
  const select= "SELECT * FROM recetas"
  const conn = await getConnection();

  try{
    const [result] = await conn.query(select);
    console.log(result);
    conn.end();
    res.json(
      {
        info: {
            count: result.lenght, //número de elementos del listado
        },
        results: result //listado de recetas
    }
    );
  } catch (error) {
    res.json (   {
      success: false, //Puede ser true o false
      message:error,
    })
  }
});


//2. GET/recetas/:id busca la receta por id

server.get("/api/recetas/:id", async (req, res) => {

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
            count: result.lenght, //número de elementos del listado
        },
        results: result //listado de recetas
    }
    );
  } catch (error) {
    console.error(error);
    
    res.json (   {
      success: false, //Puede ser true o false
      message:error,
    })
  }
  
});

//3.añadir nueva receta /receta/:nombre
server.post("/api/recetas", async (req, res) => {

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
    success: true, //Puede ser true o false
    "id": result.insertId, // id que generó MySQL para la nueva fila
  }
  );
  } catch (error) {
    res.json (   {
      success: false, //Puede ser true o false
      message:"error no se ha podido añadir esta información a su tabla",
    })
  }
});

////4. actualizar receta receta/:id

server.put("/api/recetas/:id", async (req, res) => {

  //const user= req.params.user;
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
server.delete("/api/recetas/:id", async (req, res) => {
  
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