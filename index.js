// Nombre: Milton Misael Figueroa Lagos
// Cuenta: 20221030193
// Equipo: 1

// Constante para el paquete MySQL
const mysql = require('mysql'); // Asegúrate de usar 'mysql' o 'mysql2' según lo que instalaste

// Constante para el paquete Express
const express = require('express');
const app = express(); // Inicializa Express

// Constante para el paquete body-parser
const bp = require('body-parser');

// Importar el módulo de rutas de Visitas
// Asegúrate de que este archivo 'visitas.js' exista en la misma carpeta que index.js
const visitasRoutes = require('./Visitas'); 

// Middleware para parsear los datos JSON en las peticiones
app.use(bp.json());
// Opcional: para parsear datos de formularios URL-encoded
app.use(bp.urlencoded({ extended: true }));

// Conectar a la Base de datos
var mysqlConnection = mysql.createConnection({
    host: '142.44.161.115', // 
    user: '25-1700P4PAC2E1', //
    password: '25-1700P4PAC2E1#e35', // 
    database:'25-1700P4PAC2E1', // 
    multipleStatements: true
});

// Test de conexion a base de datos
mysqlConnection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la DB:', err.stack); // Muestra el error 
        return; // Detiene la ejecución si hay un error de conexión
    }
    console.log('Conexión exitosa a la base de datos MySQL!');

    // Una vez que la conexión es exitosa, se la pasamos al módulo de visitas
    visitasRoutes.setConnection(mysqlConnection);
});

// -----------------------------------------------------------
// Rutas de la API
// -----------------------------------------------------------

// Mostrar datos al visitar localhost:3000
app.get('/', (req, res) => {
    res.send(`
        <h1> Milton Misael Figueroa Lagos</h1>
        <p><strong>Cuenta:</strong> 20221030193</p>
        <p><strong>Equipo:</strong> 1</p>
    `);
});
// Ahora, una ruta GET '/' en visitas.js se convertirá en GET '/Visitas/'
app.use('/Visitas', visitasRoutes.router);


// -----------------------------------------------------------
// Ejecutar el server en un puerto especifico.
// -----------------------------------------------------------
const port = 3000;
app.listen(port, () => {
    console.log(`Server Running puerto: ${port}`);
    
});
