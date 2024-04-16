import express from 'express';
import pg from "pg";
const { Pool } = pg;

const app = express();
const port = 3000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  password: "Pauli1989+",
  database: "Banco",
  port: 5432,
});


// Función para registrar una nueva transferencia utilizando una transacción SQL
async function registrarTransferencia(descripcion, fecha, monto, cuenta_origen, cuenta_destino) {
    try {
      await pool.query('BEGIN');
  
      // Verificar saldo suficiente en cuenta origen
      const saldoOrigen = await obtenerSaldoCuenta(cuenta_origen);
      if (saldoOrigen < monto) {
        throw new Error('Saldo insuficiente en cuenta origen');
      }
  
      // Restar monto de cuenta origen
      await restarSaldo(cuenta_origen, monto);
  
      // Sumar monto a cuenta destino
      await sumarSaldo(cuenta_destino, monto);
  
      // Registrar la transferencia
      const queryText = 'INSERT INTO transferencias (descripcion, fecha, monto, cuenta_origen, cuenta_destino) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      const values = [descripcion, fecha, monto, cuenta_origen, cuenta_destino];
      const result = await pool.query(queryText, values);
  
      await pool.query('COMMIT');
  
      console.log('Última transferencia registrada:', result.rows[0]); // Imprimir resultado aquí
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error en la transacción:', error.message);
    }
  }
  
  // Función para obtener los últimos 10 registros de transferencias de una cuenta específica
  async function obtenerUltimasTransferencias(cuenta_id) {
    const queryText = 'SELECT * FROM transferencias WHERE cuenta_origen = $1 OR cuenta_destino = $1 ORDER BY fecha DESC LIMIT 10';
    const values = [cuenta_id];
    const result = await pool.query(queryText, values);
    console.log(result.rows); // Imprimir resultado aquí
    return result.rows;
  }
  
  // Función para consultar el saldo de una cuenta específica
  async function obtenerSaldoCuenta(cuenta_id) {
    const queryText = 'SELECT saldo FROM cuentas WHERE id = $1';
    const values = [cuenta_id];
    const result = await pool.query(queryText, values);
    console.log(result.rows); // Imprimir resultado aquí
    return result.rows[0].saldo;
  }
  
  // Función para restar saldo de una cuenta
  async function restarSaldo(cuenta_id, monto) {
    const queryText = 'UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2';
    const values = [monto, cuenta_id];
    await pool.query(queryText, values);
  }
  
  // Función para sumar saldo a una cuenta
  async function sumarSaldo(cuenta_id, monto) {
    const queryText = 'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2';
    const values = [monto, cuenta_id];
    await pool.query(queryText, values);
  }
  
  // Rutas de la API

  app.use(express.urlencoded({extended:true}));
  app.use(express.json());

app.get('/transferencias', async (req, res) => {
  try {
    const{cuenta_id} = req.body;
    const transferencias = await obtenerUltimasTransferencias(cuenta_id);
    console.log(transferencias); // Imprimir resultado aquí
    res.send(transferencias);
  } catch (error) {
    console.error('Error al obtener las transferencias:', error.message);
    res.status(500).send('Error al obtener las transferencias');
  }
});

app.get('/transferencias/:cuenta_id', async (req, res) => {
  const cuenta_id = req.params.cuenta_id;

  try {
    const ultimasTransferencias = await obtenerUltimasTransferencias(cuenta_id);
    console.log(ultimasTransferencias); // Imprimir resultado aquí
    res.send(ultimasTransferencias);
  } catch (error) {
    console.error('Error al obtener las transferencias:', error.message);
    res.status(500).send('Error al obtener las transferencias');
  }
});

app.get('/saldo/:cuenta_id', async (req, res) => {
  const cuenta_id = req.params.cuenta_id;

  try {
    const saldoCuenta = await obtenerSaldoCuenta(cuenta_id);
    console.log({ saldo: saldoCuenta }); // Imprimir resultado aquí
    res.status(200).json({ saldo: saldoCuenta });
  } catch (error) {
    console.error('Error al obtener el saldo:', error.message);
    res.status(500).send('Error al obtener el saldo');
  }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor levantado en el puerto ${port}`);
  });


  
  

 
    
    
  
  

  
