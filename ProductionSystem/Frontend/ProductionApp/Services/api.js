import axios from 'axios';

// Asegúrate de cambiar esto a la IP de tu PC si pruebas en dispositivo físico
// Para emulador Android: 'http://10.0.2.2:5000/api'
// Para iOS simulador: 'http://localhost:5000/api'
export const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getMaquinas = () => api.get('/maquinas');
export const getUsuarios = () => api.get('/usuarios');
export const saveProduccion = (data) => api.post('/produccion', data);
export const getResumen = (mes, anio) => api.get(`/produccion/resumen?mes=${mes}&anio=${anio}`);
export const getProduccionDetalles = (mes, anio, maquinaId, usuarioId) => api.get(`/produccion/detalles?mes=${mes}&anio=${anio}&maquinaId=${maquinaId}&usuarioId=${usuarioId}`);
export const getOperariosConDatos = (mes, anio) => api.get(`/produccion/operarios-con-datos?mes=${mes}&anio=${anio}`);
export const getMaquinasConDatos = (mes, anio) => api.get(`/produccion/maquinas-con-datos?mes=${mes}&anio=${anio}`);
export const getProduccionPorMaquina = (mes, anio, maquinaId) => api.get(`/produccion/detalles-maquina?mes=${mes}&anio=${anio}&maquinaId=${maquinaId}`);
export const updateMaquina = (id, data) => api.put(`/maquinas/${id}`, data);
export const createMaquina = (data) => api.post('/maquinas', data);
export const createUsuario = (data) => api.post('/usuarios', data);

export default api;
