// visitas.js

const express = require('express');
const router = express.Router(); // express.Router() permite crear rutas modulares

// Declaramos la variable para la conexión.
let mysqlConnection;

/**
 * Función para establecer la conexión a la base de datos desde index.js.
 * Esta función es llamada por index.js para pasar la conexión.
 * @param {object} connection El objeto de conexión a MySQL.
 */
function setConnection(connection) {
    mysqlConnection = connection;
    // Ya no mostrará el mensaje de conexión pasada en la consola.
}

/**
 * Ruta GET para obtener todas las visitas.
 * Acceso: GET http://localhost:3000/Visitas
 * Llama al procedimiento almacenado SEL_VISITAS.
 */
router.get('/', (req, res) => {
    // Verificar si la conexión a la base de datos ha sido establecida
    if (!mysqlConnection) {
        console.error('Error: La conexión a la base de datos no está disponible en visitas.js para GET.');
        return res.status(500).send('Error interno del servidor: Conexión a la base de datos no establecida.');
    }

    // Llamada al procedimiento almacenado SEL_VISITAS
    const sql = 'CALL SEL_VISITAS();';

    mysqlConnection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al ejecutar el procedimiento almacenado SEL_VISITAS:', err);
            res.status(500).json({ error: 'Error al obtener las visitas.' });
            return;
        }

        // Los resultados de un procedimiento almacenado en 'mysql' suelen venir en un array de arrays.
        // El primer array [0] contiene los datos de tu SELECT.
        if (results && results[0]) {
            res.json(results[0]); // Envía solo el primer conjunto de resultados (tus datos de visitas)
        } else {
            res.status(404).json({ message: 'No se encontraron visitas o el formato de respuesta es inesperado.' });
        }
    });
});

/**
 * Ruta POST para insertar una nueva visita.
 * Acceso: POST http://localhost:3000/Visitas/insertar
 * Llama al procedimiento almacenado INS_VISITAs.
 *
 * El cuerpo de la solicitud (req.body) debe contener los siguientes campos (JSON):
 * {
 * "PI_COD_PERSONA": 1,
 * "PV_HORA_SALIDA": "2025-06-30 18:00:00", // FormatoYYYY-MM-DD HH:MM:SS
 * "PV_MOTIVO_VISITA": "Consulta general",
 * "PV_OBSERVACIONES": "Ninguna",
 * "PI_CANTIDAD_ADULTOS": 2,
 * "PI_CANTIDAD_NINOS": 1,
 * "PD_PRECIO_ENTRADA_ADULTO": 10.50,
 * "PD_PRECIO_ENTRADA_NINO": 5.25,
 * "PI_COD_BOSQUE": 1,
 * "PI_COD_ACCESO": 1
 * }
 */
router.post('/insertar', (req, res) => {
    // Verificar si la conexión a la base de datos ha sido establecida
    if (!mysqlConnection) {
        console.error('Error: La conexión a la base de datos no está disponible para insertar visitas.');
        return res.status(500).send('Error interno del servidor: Conexión a la base de datos no establecida.');
    }

    // Extraer los datos del cuerpo de la solicitud
    const {
        PI_COD_PERSONA,
        PV_HORA_SALIDA,
        PV_MOTIVO_VISITA,
        PV_OBSERVACIONES,
        PI_CANTIDAD_ADULTOS,
        PI_CANTIDAD_NINOS,
        PD_PRECIO_ENTRADA_ADULTO,
        PD_PRECIO_ENTRADA_NINO,
        PI_COD_BOSQUE,
        PI_COD_ACCESO
    } = req.body;

    // Validar que los campos obligatorios estén presentes
    if (!PI_COD_PERSONA || !PV_MOTIVO_VISITA || !PI_CANTIDAD_ADULTOS || !PI_COD_BOSQUE) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para insertar la visita.' });
    }

    // Llamada al procedimiento almacenado INS_VISITAs (10 parámetros)
    const sql = 'CALL INS_VISITAs(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
    const params = [
        PI_COD_PERSONA,
        PV_HORA_SALIDA,
        PV_MOTIVO_VISITA,
        PV_OBSERVACIONES,
        PI_CANTIDAD_ADULTOS,
        PI_CANTIDAD_NINOS,
        PD_PRECIO_ENTRADA_ADULTO,
        PD_PRECIO_ENTRADA_NINO,
        PI_COD_BOSQUE,
        PI_COD_ACCESO
    ];

    mysqlConnection.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar el procedimiento almacenado INS_VISITAs:', err);
            res.status(500).json({ error: 'Error al insertar la visita.' });
            return;
        }

        // Manejar la respuesta del procedimiento almacenado (si el SP devuelve 'SUCCESS' o 'ERROR')
        if (results && results[0] && results[0][0]) {
            const spResponse = results[0][0];

            if (spResponse.status === 'SUCCESS') {
                res.status(201).json({ message: spResponse.message });
            } else {
                console.error('Error reportado por el SP INS_VISITAs:', spResponse.message);
                res.status(500).json({
                    error: spResponse.message,
                    sql_state: spResponse.sql_state,
                    mysql_errno: spResponse.mysql_errno
                });
            }
        } else {
            res.status(201).json({ message: 'Visita insertada con éxito (respuesta genérica).' });
        }
    });
});

/**
 * Ruta PUT para actualizar una visita existente.
 * Acceso: PUT http://localhost:3000/Visitas/:cod_visita
 * Llama al procedimiento almacenado UPD_VISITAS.
 *
 * El :cod_visita en la URL es el ID de la visita a actualizar.
 * El cuerpo de la solicitud (req.body) debe contener los siguientes campos (JSON):
 * {
 * "PV_HORA_SALIDA": "2025-07-01 10:00:00", 
 * "PV_MOTIVO_VISITA": "Revisión de seguridad",
 * "PV_OBSERVACIONES": "Ruta despejada",
 * "PI_CANTIDAD_ADULTOS": 3,
 * "PI_CANTIDAD_NINOS": 0,
 * "PD_PRECIO_ENTRADA_ADULTO": 12.00,
 * "PD_PRECIO_ENTRADA_NINO": 6.00
 * }
 * Las claves foráneas (cod_persona, cod_bosque, cod_acceso) NO se actualizan.
 */
router.put('/:cod_visita', (req, res) => {
    // Verificar si la conexión a la base de datos ha sido establecida
    if (!mysqlConnection) {
        console.error('Error: La conexión a la base de datos no está disponible para actualizar visitas.');
        return res.status(500).send('Error interno del servidor: Conexión a la base de datos no establecida.');
    }

    // Convertir cod_visita a entero.
    const PI_COD_VISITA = parseInt(req.params.cod_visita, 10);

    // Validar que el ID sea un número válido
    if (isNaN(PI_COD_VISITA)) {
        return res.status(400).json({ error: 'ID de visita inválido. Debe ser un número.' });
    }

    // Extraer los datos del cuerpo de la solicitud (SOLO los campos actualizables)
    const {
        PV_HORA_SALIDA,
        PV_MOTIVO_VISITA,
        PV_OBSERVACIONES,
        PI_CANTIDAD_ADULTOS,
        PI_CANTIDAD_NINOS,
        PD_PRECIO_ENTRADA_ADULTO,
        PD_PRECIO_ENTRADA_NINO
    } = req.body;

    // Validar que los campos obligatorios estén presentes (ajusta según tus necesidades)
    if (!PV_MOTIVO_VISITA || !PI_CANTIDAD_ADULTOS) { // Puedes hacer esta validación más estricta
        return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar la visita.' });
    }

    // Llamada al procedimiento almacenado UPD_VISITAS (8 parámetros: PI_COD_VISITA + 7 campos actualizables)
    const sql = 'CALL UPD_VISITAS(?, ?, ?, ?, ?, ?, ?, ?);'; 
    const params = [
        PI_COD_VISITA,
        PV_HORA_SALIDA,
        PV_MOTIVO_VISITA,
        PV_OBSERVACIONES,
        PI_CANTIDAD_ADULTOS,
        PI_CANTIDAD_NINOS,
        PD_PRECIO_ENTRADA_ADULTO,
        PD_PRECIO_ENTRADA_NINO
    ];

    mysqlConnection.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar el procedimiento almacenado UPD_VISITAS:', err);
            res.status(500).json({ error: 'Error al actualizar la visita.' });
            return;
        }

        // Manejar la respuesta del procedimiento almacenado
        if (results && results[0] && results[0][0]) {
            const spResponse = results[0][0];

            if (spResponse.status === 'SUCCESS') {
                res.status(200).json({ message: spResponse.message }); // 200 OK para actualización exitosa
            } else {
                console.error('Error reportado por el SP UPD_VISITAS:', spResponse.message);
                // Si el SP indica que no encontró la visita, devolver 404
                if (spResponse.message.includes('No se encontró la visita')) {
                    res.status(404).json({ error: spResponse.message });
                } else {
                    res.status(500).json({
                        error: spResponse.message,
                        sql_state: spResponse.sql_state,
                        mysql_errno: spResponse.mysql_errno
                    });
                }
            }
        } else {
            res.status(200).json({ message: 'Visita actualizada con éxito (respuesta genérica).' });
        }
    });
});

// Exporta el router y la función setConnection para que puedan ser usados en index.js
module.exports = {
    router: router,
    setConnection: setConnection
};
