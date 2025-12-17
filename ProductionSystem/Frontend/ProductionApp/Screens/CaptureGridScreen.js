import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getMaquinas, getUsuarios, saveProduccion, getProduccionDetalles, getOperariosConDatos, getMaquinasConDatos, getProduccionPorMaquina, API_URL } from '../Services/api';
import CustomNavBar from '../Components/CustomNavBar';
import { useTheme } from '../Contexts/ThemeContext';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
let rowIdCounter = 100; // Para IDs únicos de filas

export default function CaptureGridScreen({ navigation }) {
    const { colors } = useTheme();
    // Selectors
    const [selectedOperario, setSelectedOperario] = useState(null);
    const [selectedMaquina, setSelectedMaquina] = useState(null);
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());

    const logoSource = require('../assets/LOGO_ALEPH_IMPRESORES.jpg');

    // Lists
    const [maquinas, setMaquinas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // Grid Data
    const [gridData, setGridData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [operariosConDatos, setOperariosConDatos] = useState([]);
    const [maquinasConDatos, setMaquinasConDatos] = useState([]);
    const [modalTab, setModalTab] = useState('operario'); // 'operario' or 'maquina'

    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, rowIndex: null });

    // Selected Row State (for highlighting)
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);

    // Export Modal State
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [periodosDisponibles, setPeriodosDisponibles] = useState([]);
    const [exportMes, setExportMes] = useState(new Date().getMonth() + 1);
    const [exportAnio, setExportAnio] = useState(new Date().getFullYear());
    const [exportFormat, setExportFormat] = useState('csv');

    // Delete Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteOption, setDeleteOption] = useState('maquina'); // 'maquina' | 'operario'
    const [deleteOperarioId, setDeleteOperarioId] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadLists();
    }, []);

    // Recargar máquinas cuando la pantalla recibe foco (para actualizar parámetros modificados)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('CaptureGridScreen focused - reloading machine data...');
            reloadMachines();
        });
        return unsubscribe;
    }, [navigation]);

    const reloadMachines = async () => {
        try {
            const res = await getMaquinas();
            setMaquinas(res.data);
            console.log('Máquinas actualizadas:', res.data.length);
        } catch (e) {
            console.error('Error recargando máquinas:', e);
        }
    };

    // Reset grid when maquinas are loaded
    useEffect(() => {
        if (maquinas.length > 0 && gridData.length === 0) {
            resetGrid();
        }
    }, [maquinas]);

    const loadLists = async () => {
        try {
            const [m, u] = await Promise.all([getMaquinas(), getUsuarios()]);
            setMaquinas(m.data);
            setUsuarios(u.data);
            // Default to null to force selection (User Request)
            setSelectedMaquina(null);
            if (u.data.length > 0) setSelectedOperario(u.data[0].id);
        } catch (e) {
            console.error(e);
            alert("Error: No se pudieron cargar las listas");
        }
    };

    const resetGrid = () => {
        const initial = DAYS.map((d, idx) => ({
            rowId: idx + 1, // ID único para cada fila
            day: d,
            maquinaId: null, // Máquina por defecto nula
            operarioId: null, // Sin operario asignado por defecto
            horaInicio: '',
            horaFin: '',
            rFinal: '',
            horasOp: '',
            cambios: '',
            puestaPunto: '',
            mantenimiento: '',
            aseo: '',
            descansos: '',
            otrosAux: '',
            faltaTrabajo: '',
            reparacion: '',
            otroMuerto: '',
            desperdicio: '',
            referenciaOP: '',
            novedades: ''
        }));
        rowIdCounter = 100; // Reset counter
        setGridData(initial);
    };

    // Helper para formatear visualización (es-CO: punto=miles, coma=decimal)
    const formatForDisplay = (val) => {
        if (val === null || val === undefined || val === '') return '';
        // Si es string y ya tiene formato, devolver.
        // Asumimos que viene número del backend o string numérico simple "3.67".
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        // Usar Intl para formatear correctamente con miles y decimales
        return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
    };

    const handleLoadData = async (maquinaIdToLoad = null, operarioOverride = null) => {
        // Use override if provided, otherwise state
        const opToLoad = operarioOverride || selectedOperario;

        if (!opToLoad) {
            // If no operario selected (and loading by operario logic), maybe alert?
            // But let's proceed to allow partial load if logic permits.
            // Actually getProduccionDetalles needs an operario.
            // If opToLoad is null, the API might fail or return nothing.
        }

        if (!maquinaIdToLoad) {
            console.log("No machine specified for loading");
            return;
        }

        // Actualizar selector visualmente
        setSelectedMaquina(maquinaIdToLoad);

        try {
            console.log(`Cargando datos Maq:${maquinaIdToLoad} Op:${opToLoad}`);
            // Fetch from API for specific machine
            const res = await getProduccionDetalles(mes, anio, maquinaIdToLoad, opToLoad);

            let dbData = res.data;
            if (!dbData) dbData = [];

            // if data is empty, we still want to render the grid (empty)
            /* 
            if (!dbData || dbData.length === 0) {
                alert("No hay datos guardados para esta selección");
                return;
            } */

            // Map DB array to Grid array (31 days) with the loaded machine
            const newGrid = DAYS.map((d, idx) => {
                // Find record for this day
                const record = dbData.find(item => {
                    const fechaStr = item.fecha.split('T')[0];
                    const dayFromDb = parseInt(fechaStr.split('-')[2], 10);
                    return dayFromDb === d;
                });

                if (record) {
                    console.log(`Día ${d} encontrado. OpID en BD: ${record.usuarioId} (${typeof record.usuarioId})`);
                    return {
                        rowId: idx + 1,
                        day: d,
                        maquinaId: maquinaIdToLoad,
                        operarioId: record.usuarioId, // Should match DB
                        horaInicio: record.horaInicio?.substring(0, 5) || '',
                        horaFin: record.horaFin?.substring(0, 5) || '',

                        // Formatear numéricos para display (es-CO)
                        rFinal: formatForDisplay(record.rendimientoFinal),
                        horasOp: formatForDisplay(record.horasOperativas),
                        cambios: record.cambios?.toString() || '',
                        puestaPunto: formatForDisplay(record.tiempoPuestaPunto),

                        mantenimiento: formatForDisplay(record.horasMantenimiento),
                        descansos: formatForDisplay(record.horasDescanso),
                        otrosAux: formatForDisplay(record.horasOtrosAux),

                        faltaTrabajo: formatForDisplay(record.tiempoFaltaTrabajo),
                        reparacion: formatForDisplay(record.tiempoReparacion),
                        otroMuerto: formatForDisplay(record.tiempoOtroMuerto),

                        desperdicio: formatForDisplay(record.desperdicio),
                        referenciaOP: record.referenciaOP || '',
                        novedades: record.novedades || ''
                    };
                } else {
                    // Empty day - Leave operario empty as requested
                    return {
                        rowId: idx + 1,
                        day: d,
                        maquinaId: maquinaIdToLoad,
                        operarioId: null, // DO NOT autofill with opToLoad
                        horaInicio: '', horaFin: '', rFinal: '', horasOp: '', cambios: '', puestaPunto: '',
                        mantenimiento: '', descansos: '', otrosAux: '', faltaTrabajo: '', reparacion: '',
                        otroMuerto: '', desperdicio: '', referenciaOP: '', novedades: ''
                    };
                }
            });

            rowIdCounter = 100;
            setGridData(newGrid);
            alert(`Datos cargados para la máquina seleccionada (${dbData.length} registros)`);

        } catch (e) {
            console.error("Error loading data", e);
            alert("Error al cargar datos");
        }
    };

    const handleOpenLoadModal = async () => {
        console.log("Abriendo modal para cargar datos...");
        try {
            const [opRes, maqRes] = await Promise.all([
                getOperariosConDatos(mes, anio),
                getMaquinasConDatos(mes, anio)
            ]);
            console.log("Operarios con datos:", opRes.data);
            console.log("Máquinas con datos:", maqRes.data);
            setOperariosConDatos(opRes.data);
            setMaquinasConDatos(maqRes.data);
            setModalVisible(true);
        } catch (e) {
            console.error("Error cargando datos para modal", e);
            alert("Error al consultar datos. Verifica que el backend esté corriendo.");
        }
    };

    const handleSelectFromModal = (item) => {
        console.log("Seleccionado:", item);
        setModalVisible(false);
        if (modalTab === 'maquina') {
            handleLoadByMachine(item.id);
        } else {
            // Cargar por operario específico
            if (item.usuarioId) setSelectedOperario(item.usuarioId);
            handleLoadData(item.maquinaId, item.usuarioId);
        }
    };

    // Cargar datos por máquina (trae todos los operarios de esa máquina)
    const handleLoadByMachine = async (maquinaId) => {
        console.log("Cargando por máquina:", maquinaId);
        setModalVisible(false);

        // Actualizar selector visualmente
        setSelectedMaquina(maquinaId);

        try {
            const res = await getProduccionPorMaquina(mes, anio, maquinaId);
            const dbData = res.data;

            if (!dbData || dbData.length === 0) {
                alert("No hay datos guardados para esta máquina");
                return;
            }

            // Crear filas para cada registro (puede haber múltiples por día con diferentes operarios)
            // Lógica de Merge: Iterar los días del mes (1..31).
            // Si hay registros para ese día, agregarlos.
            // Si no hay, agregar una fila vacía para ese día.

            let tempRowId = 1;

            const newGrid = DAYS.flatMap(d => {
                const dayRecords = dbData.filter(r => {
                    const fechaStr = r.fecha.split('T')[0]; // YYYY-MM-DD
                    const dayFromDb = parseInt(fechaStr.split('-')[2], 10);
                    return dayFromDb === d;
                });

                if (dayRecords.length > 0) {
                    return dayRecords.map(record => ({
                        rowId: tempRowId++,
                        day: d,
                        maquinaId: maquinaId,
                        operarioId: record.usuarioId,
                        horaInicio: record.horaInicio?.substring(0, 5) || '',
                        horaFin: record.horaFin?.substring(0, 5) || '',

                        rFinal: formatForDisplay(record.rendimientoFinal),
                        horasOp: formatForDisplay(record.horasOperativas),
                        cambios: record.cambios?.toString() || '',
                        puestaPunto: formatForDisplay(record.tiempoPuestaPunto),

                        mantenimiento: formatForDisplay(record.horasMantenimiento),
                        descansos: formatForDisplay(record.horasDescanso),
                        otrosAux: formatForDisplay(record.horasOtrosAux),

                        faltaTrabajo: formatForDisplay(record.tiempoFaltaTrabajo),
                        reparacion: formatForDisplay(record.tiempoReparacion),
                        otroMuerto: formatForDisplay(record.tiempoOtroMuerto),

                        desperdicio: formatForDisplay(record.desperdicio),
                        referenciaOP: record.referenciaOP || '',
                        novedades: record.novedades || ''
                    }));
                } else {
                    // Fila vacía para este día
                    return [{
                        rowId: tempRowId++,
                        day: d,
                        maquinaId: maquinaId,
                        operarioId: null,
                        horaInicio: '', horaFin: '', rFinal: '', horasOp: '', cambios: '', puestaPunto: '',
                        mantenimiento: '', descansos: '', otrosAux: '', faltaTrabajo: '', reparacion: '',
                        otroMuerto: '', desperdicio: '', referenciaOP: '', novedades: ''
                    }];
                }
            });

            rowIdCounter = tempRowId + 100;
            setGridData(newGrid);
            alert(`Datos cargados: ${dbData.length} registros (mostrando ${newGrid.length} filas)`);

        } catch (e) {
            console.error("Error cargando por máquina", e);
            alert("Error al cargar datos de la máquina");
        }
    };

    const updateDay = (dayIndex, field, value) => {
        // Validation moved to UI: Inputs are disabled if !selectedMaquina.
        // Alert removed to prevent onBlur loops.
        setGridData(prevData => {
            const newData = [...prevData];
            if (newData[dayIndex]) {
                newData[dayIndex] = { ...newData[dayIndex], [field]: value };
            }
            return newData;
        });
    };

    // Obtener máquina por ID (usando == para manejar strings y números)
    const getMaquinaById = (id) => maquinas.find(m => m.id == id) || null;

    // Mostrar menú contextual
    const handleContextMenu = (e, rowIndex) => {
        e.preventDefault(); // Evitar menú del navegador
        setContextMenu({
            visible: true,
            x: e.clientX || e.nativeEvent?.pageX || 100,
            y: e.clientY || e.nativeEvent?.pageY || 100,
            rowIndex: rowIndex
        });
    };

    // Duplicar una fila
    const handleDuplicateRow = () => {
        if (contextMenu.rowIndex === null) return;

        const originalRow = gridData[contextMenu.rowIndex];
        const newRow = {
            ...originalRow,
            rowId: ++rowIdCounter, // Nuevo ID único
            maquinaId: selectedMaquina || originalRow.maquinaId, // Mantener la máquina seleccionada en el header
            operarioId: null, // Operario vacío por defecto (el usuario selecciona)
            isDuplicate: true // Marcar como fila duplicada (para poder eliminar)
            // No vaciamos los datos - los mantenemos para que los cálculos funcionen
        };

        // Insertar después de la fila original
        const newData = [...gridData];
        newData.splice(contextMenu.rowIndex + 1, 0, newRow);
        setGridData(newData);
        setContextMenu({ visible: false, x: 0, y: 0, rowIndex: null });
    };

    // Cerrar menú contextual
    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, rowIndex: null });
    };

    // Eliminar una fila duplicada
    const handleDeleteRow = () => {
        if (contextMenu.rowIndex === null) return;

        const row = gridData[contextMenu.rowIndex];
        if (!row.isDuplicate) {
            alert('Solo se pueden eliminar filas duplicadas');
            closeContextMenu();
            return;
        }

        const newData = [...gridData];
        newData.splice(contextMenu.rowIndex, 1);
        setGridData(newData);
        setSelectedRowIndex(null);
        closeContextMenu();
    };

    // Seleccionar una fila (para resaltar)
    const handleRowClick = (index) => {
        setSelectedRowIndex(index);
    };

    // Formatear número con separador de miles (12000 -> 12.000)
    const formatNumber = (value) => {
        if (!value && value !== 0) return '';
        const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
        if (isNaN(num)) return value;
        // Formato con punto como separador de miles, coma como decimal
        return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // Parsear número formateado a valor numérico (12.000 -> 12000)
    const parseNumber = (value) => {
        if (!value) return '';
        // Remover puntos de miles, mantener coma decimal
        return value.replace(/\./g, '').replace(',', '.');
    };

    // Manejar input numérico con formato
    const handleNumericInput = (index, field, value) => {
        // Reemplazar punto por coma automáticamente (para teclado numérico)
        const valWithComma = value.replace(/\./g, ',');
        // Solo permitir números y comas
        const cleaned = valWithComma.replace(/[^0-9,]/g, '');
        updateDay(index, field, cleaned);
    };

    // Formatear hora 24h a 12h para MOSTRAR
    const formatTo12h = (time24) => {
        if (!time24 || time24.length < 5) return time24;
        const [hoursStr, minutes] = time24.split(':');
        let hours = parseInt(hoursStr, 10);
        if (isNaN(hours)) return time24;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 -> 12
        return `${hours}:${minutes}${ampm}`;
    };

    // Convertir 12h a 24h para guardar
    const parse12hTo24h = (time12) => {
        if (!time12) return '';
        // Si ya es 24h (no tiene AM/PM), devolver tal cual
        if (!time12.includes('AM') && !time12.includes('PM')) return time12;

        const match = time12.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
        if (!match) return time12;

        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    // Validar entrada de hora (solo números y :)
    const handleTimeInput = (dayIndex, field, text) => {
        // Si el usuario borra, limpiar el campo
        if (!text || text.length === 0) {
            updateDay(dayIndex, field, '');
            return;
        }

        // Si viene con AM/PM (valor mostrado), convertir a 24h primero
        let cleanInput = text;
        if (text.includes('AM') || text.includes('PM')) {
            cleanInput = parse12hTo24h(text);
        }

        // Solo permitir números y :
        const cleaned = cleanInput.replace(/[^0-9:]/g, '');
        // Auto-insertar : después de 2 dígitos
        let formatted = cleaned;
        if (cleaned.length === 2 && !cleaned.includes(':')) {
            formatted = cleaned + ':';
        }
        // Limitar a 5 caracteres (HH:MM)
        if (formatted.length > 5) {
            formatted = formatted.substring(0, 5);
        }
        updateDay(dayIndex, field, formatted);
    };

    // Obtener valor a mostrar (12h si está completo, sino 24h para edición)
    const getDisplayTime = (time24) => {
        if (!time24) return '';
        if (time24.length === 5) {
            return formatTo12h(time24);
        }
        return time24;
    };

    // Helper para parsear números locales (Colombia/Latam: punto=miles, coma=decimal)
    const parseNumberInput = (v) => {
        if (!v && v !== 0) return 0;
        const str = String(v);
        // Eliminar puntos de miles
        let cleaned = str.replace(/\./g, '');
        // Reemplazar coma decimal por punto
        cleaned = cleaned.replace(',', '.');
        return parseFloat(cleaned) || 0;
    };

    const calculateRow = (day) => {
        // Usar la máquina de la fila si existe (carga), sino la seleccionada global
        const maquinaId = day.maquinaId || selectedMaquina;
        const rowMaquina = getMaquinaById(maquinaId);
        if (!rowMaquina) return {};

        // Inputs
        const R_Final = parseNumberInput(day.rFinal);
        const Cambios = parseNumberInput(day.cambios); // Cambios could be float? usually int but safe to parse as number
        const HorasOp = parseNumberInput(day.horasOp);
        const PuestaPunto = parseNumberInput(day.puestaPunto);

        // Aux
        const MantAseo = parseNumberInput(day.mantenimiento);
        const Descansos = parseNumberInput(day.descansos);
        const OtrosAux = parseNumberInput(day.otrosAux);

        // Dead
        const FaltaTrabajo = parseNumberInput(day.faltaTrabajo);
        const Reparacion = parseNumberInput(day.reparacion);
        const OtroMuerto = parseNumberInput(day.otroMuerto);

        // --- CALCULATIONS ---

        // 1. Tiros Equivalentes = (TirosReferencia × Cambios) + R_Final
        const TirosRef = rowMaquina.tirosReferencia || 0;
        const TirosEquivalentes = (TirosRef * Cambios) + R_Final;

        // 2. Total Horas Productivas = HorasOp + PuestaPunto
        const TotalHorasProd = HorasOp + PuestaPunto;

        // 3. Promedio Hora Productiva = TirosEquivalentes / TotalHorasProd
        const Promedio = TotalHorasProd > 0 ? (TirosEquivalentes / TotalHorasProd) : 0;

        // 4. 75% Meta = TirosEquivalentes - MetaRendimiento (meta ya es el 75%)
        const MetaRendimiento = rowMaquina.metaRendimiento || 0;
        const Meta75Diff = TirosEquivalentes - MetaRendimiento;

        // 5. Vr Tiro = Meta75Diff × ValorPorTiro (puede ser negativo)
        const ValorPorTiro = rowMaquina.valorPorTiro || 0;
        const VrTiroRaw = Meta75Diff * ValorPorTiro;

        // 6. Vr a Pagar (solo positivo para display y guardado)
        const VrPagar = VrTiroRaw > 0 ? VrTiroRaw : 0;

        // 7. Total Horas Auxiliares
        const TotalAux = MantAseo + Descansos + OtrosAux;

        // 8. Total Tiempos Muertos
        const TotalMuertos = FaltaTrabajo + Reparacion + OtroMuerto;

        // 9. Total Horas
        const TotalHoras = TotalHorasProd + TotalAux + TotalMuertos;

        // 10. Dia Laborado
        const DiaLaborado = TotalHoras > 0 ? 1 : 0;

        return {
            TirosEquivalentes,
            TotalHorasProd,
            Promedio,
            Meta75Diff,
            VrTiroRaw,
            VrPagar,
            TotalAux,
            TotalMuertos,
            TotalHoras,
            DiaLaborado
        };
    };



    const handleSaveMonth = async () => {
        console.log("=== BOTÓN GUARDAR PRESIONADO ===");

        const dataToSave = [];
        const missingHours = [];
        const missingOperario = [];

        gridData.forEach((day, idx) => {
            const calcs = calculateRow(day);
            console.log(`Fila ${idx} (día ${day.day}, máquina ${day.maquinaId}): TotalHoras=${calcs.TotalHoras}, horaInicio=${day.horaInicio}, horaFin=${day.horaFin}`);
            if (calcs.TotalHoras > 0) {
                // Validar operario en esta fila
                if (!day.operarioId) {
                    missingOperario.push(`Día ${day.day}: Falta Operario`);
                    return;
                }

                // Hora Inicio/Fin ahora son opcionales (pero deberían ser coherentes si se indican)
                if (day.horaInicio && day.horaFin && day.horaFin < day.horaInicio) {
                    missingHours.push(`Día ${day.day}: Hora Fin (${day.horaFin}) es menor que Hora Inicio (${day.horaInicio})`);
                    // Warn but allow save? Or block? Let's warn.
                }

                const dateStr = `${anio}-${mes.toString().padStart(2, '0')}-${day.day.toString().padStart(2, '0')}`;

                // Helper to format time (si está vacío enviar "00:00")
                const fmtTime = (t) => {
                    if (!t || t.length === 0) return "00:00:00";
                    if (t.length === 5) return t + ":00";
                    return "00:00:00";
                };

                // Obtener máquina seleccionada (Global)
                const rowMaq = getMaquinaById(selectedMaquina);

                const payload = {
                    Fecha: dateStr,
                    UsuarioId: day.operarioId,
                    MaquinaId: parseInt(selectedMaquina), // Use Global Machine Selector
                    HoraInicio: fmtTime(day.horaInicio),
                    HoraFin: fmtTime(day.horaFin),

                    HorasOperativas: parseNumberInput(day.horasOp),
                    RendimientoFinal: parseNumberInput(day.rFinal),
                    Cambios: parseInt(day.cambios) || 0,
                    TiempoPuestaPunto: parseNumberInput(day.puestaPunto),
                    TirosDiarios: Math.round(calcs.TirosEquivalentes),

                    TotalHorasProductivas: calcs.TotalHorasProd,
                    PromedioHoraProductiva: calcs.Promedio,
                    ValorTiroSnapshot: rowMaq?.valorPorTiro || 0,
                    ValorAPagar: calcs.VrPagar,

                    HorasMantenimiento: parseNumberInput(day.mantenimiento),
                    HorasDescanso: parseNumberInput(day.descansos),
                    HorasOtrosAux: parseNumberInput(day.otrosAux),

                    TiempoFaltaTrabajo: parseNumberInput(day.faltaTrabajo),
                    TiempoReparacion: parseNumberInput(day.reparacion),
                    TiempoOtroMuerto: parseNumberInput(day.otroMuerto),

                    ReferenciaOP: day.referenciaOP || "",
                    Novedades: day.novedades || "",
                    Desperdicio: parseNumberInput(day.desperdicio),
                    DiaLaborado: 1
                };
                dataToSave.push(payload);
                console.log("Día agregado:", day.day, payload);
            }
        });

        console.log("Total días a guardar:", dataToSave.length);
        console.log("Días con horas faltantes:", missingHours);

        if (missingOperario.length > 0) {
            alert("Falta asignar operario:\n" + missingOperario.join("\n"));
        }

        if (missingHours.length > 0) {
            alert("Faltan horas obligatorias:\n" + missingHours.join("\n"));
        }

        if (dataToSave.length === 0) {
            console.log("No hay datos para guardar");
            if (missingHours.length === 0) {
                alert("Aviso: No hay días con datos para guardar. Ingresa al menos H. Oper o algún tiempo en una fila.");
            }
            return;
        }

        try {
            setLoading(true);
            // Sequential save (could be Promise.all but might overload if many)
            let errors = 0;
            for (const item of dataToSave) {
                try {
                    await saveProduccion(item);
                } catch (e) {
                    console.error("Error saving day", item.Fecha, e);
                    errors++;
                }
            }

            setLoading(false);
            if (errors === 0) {
                alert("Éxito: Toda la información ha sido guardada correctamente en la Base de Datos.");
                resetGrid(); // Limpiar todas las celdas después de guardar
            } else {
                alert(`Advertencia: Se guardaron algunos datos, pero hubo ${errors} errores. Verifica la conexión.`);
            }
        } catch (error) {
            setLoading(false);
            console.error(error);
            alert("Error: Fallo crítico al intentar conectar con el servidor.");
        }
    };

    // Export Functions
    const handleOpenExportModal = async () => {
        try {
            const res = await fetch(`${require('../Services/api').API_URL}/produccion/periodos-disponibles`);
            const data = await res.json();
            setPeriodosDisponibles(data);
            if (data.length > 0) {
                setExportMes(data[0].mes);
                setExportAnio(data[0].anio);
            }
            setExportModalVisible(true);
        } catch (e) {
            console.error("Error cargando periodos", e);
            alert("Error al cargar periodos disponibles");
        }
    };

    const getMesNombre = (m) => {
        const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[m] || '';
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`${require('../Services/api').API_URL}/produccion/historial?fechaInicio=${exportAnio}-${String(exportMes).padStart(2, '0')}-01&fechaFin=${exportAnio}-${String(exportMes).padStart(2, '0')}-31`);
            const data = await res.json();

            if (!data || data.length === 0) {
                alert("No hay datos para exportar en el periodo seleccionado");
                return;
            }

            // Create CSV/Excel content
            const headers = ['Fecha', 'Operario', 'Máquina', 'Hora Inicio', 'Hora Fin', 'Tiros', 'Horas Prod', 'Promedio', 'Valor a Pagar'];
            const rows = data.map(item => [
                item.fecha?.split('T')[0] || '',
                item.usuario?.nombre || '',
                item.maquina?.nombre || '',
                item.horaInicio || '',
                item.horaFin || '',
                item.tirosDiarios || 0,
                item.totalHorasProductivas?.toFixed(2) || 0,
                item.promedioHoraProductiva?.toFixed(2) || 0,
                item.valorAPagar?.toFixed(0) || 0
            ]);

            let content = '';
            const filename = `Produccion_${getMesNombre(exportMes)}_${exportAnio}`;

            if (exportFormat === 'csv') {
                content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${filename}.csv`;
                link.click();
            } else {
                // Excel format (simple HTML table that Excel can open)
                content = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
                rows.forEach(row => {
                    content += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
                });
                content += '</table>';
                const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${filename}.xls`;
                link.click();
            }

            setExportModalVisible(false);
            alert(`Archivo ${exportFormat.toUpperCase()} generado exitosamente`);
        } catch (e) {
            console.error("Error exportando", e);
            alert("Error al exportar datos");
        }
    };

    // DELETE LOGIC
    const handleOpenDeleteModal = async () => {
        try {
            setDeleteModalVisible(true);
            setDeleteOption('operario');
            const [opRes, maqRes] = await Promise.all([
                getOperariosConDatos(mes, anio),
                getMaquinasConDatos(mes, anio)
            ]);
            setOperariosConDatos(opRes.data || []);
            setMaquinasConDatos(maqRes.data || []);
        } catch (e) {
            console.error("Error cargando datos para borrar", e);
            alert("Error al cargar lista de datos para borrar");
        }
    };

    const confirmDelete = async (id, type, name) => {
        let params = { mes, anio };
        let confirmMsg = "";

        if (type === 'maquina') {
            params.maquinaId = id;
            confirmMsg = `¿Estás seguro de ELIMINAR todo lo capturado para la máquina ${name} en este mes?`;
        } else {
            params.usuarioId = id;
            confirmMsg = `¿Estás seguro de ELIMINAR todo lo capturado para el operario ${name} en este mes?`;
        }

        if (confirm(confirmMsg)) {
            setIsDeleting(true);
            try {
                const query = new URLSearchParams(params).toString();
                const res = await fetch(`${API_URL}/Produccion/borrar?${query}`, { method: 'DELETE' });

                if (res.ok) {
                    alert("Datos eliminados correctamente.");
                    // Refresh lists to remove deleted item
                    handleOpenDeleteModal();

                    // If deleted current view, reset grid
                    if ((type === 'maquina' && selectedMaquina === id) ||
                        (type === 'operario' && selectedOperario === id)) {
                        resetGrid();
                    }
                } else {
                    const txt = await res.text();
                    alert("Error al borrar: " + txt);
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión al borrar");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // Clean Fields Logic
    const handleCleanFields = () => {
        if (!confirm('¿Estás seguro de LIMPIAR todos los campos editables? Esto borrará lo que has escrito (NO afecta la base de datos).')) {
            return;
        }

        const cleanedGrid = gridData.map(row => ({
            ...row,
            horaInicio: '',
            horaFin: '',
            rFinal: '',
            horasOp: '',
            cambios: '',
            puestaPunto: '',
            mantenimiento: '',
            aseo: '',
            descansos: '',
            otrosAux: '',
            faltaTrabajo: '',
            reparacion: '',
            otroMuerto: '',
            desperdicio: '',
            referenciaOP: '',
            novedades: '',
            // Reset operario to empty (null) so user can choose or leave empty
            operarioId: null
        }));

        setGridData(cleanedGrid);
    };

    return (
        <View style={styles.container} onClick={closeContextMenu}>
            {/* Header Controls */}
            <View style={styles.header}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image source={logoSource} style={styles.logo} resizeMode="contain" />
                </View>
                <View style={styles.row}>
                    <Text>Mes:</Text>
                    <select
                        value={mes}
                        onChange={(e) => setMes(parseInt(e.target.value))}
                        style={{ marginLeft: 5, marginRight: 15, padding: 5 }}
                    >
                        <option value={1}>Enero</option>
                        <option value={2}>Febrero</option>
                        <option value={3}>Marzo</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Mayo</option>
                        <option value={6}>Junio</option>
                        <option value={7}>Julio</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Septiembre</option>
                        <option value={10}>Octubre</option>
                        <option value={11}>Noviembre</option>
                        <option value={12}>Diciembre</option>
                    </select>
                    <Text>Año:</Text>
                    <select
                        value={anio}
                        onChange={(e) => setAnio(parseInt(e.target.value))}
                        style={{ marginLeft: 5, marginRight: 15, padding: 5 }}
                    >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                        <option value={2028}>2028</option>
                        <option value={2029}>2029</option>
                        <option value={2030}>2030</option>
                    </select>
                    <Text style={{ marginLeft: 15 }}>Máquina:</Text>
                    <select
                        value={selectedMaquina || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                                setSelectedMaquina(null);
                                // Optional: Reset grid or clear
                                return;
                            }
                            const newId = parseInt(val);
                            setSelectedMaquina(newId);
                            // Auto-load data when machine changes to update grid context
                            handleLoadData(newId);
                        }}
                        style={{ marginLeft: 5, marginRight: 15, padding: 5, minWidth: 150 }}
                    >
                        <option value="">-- Seleccionar --</option>
                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <TouchableOpacity style={styles.btnLoad} onPress={handleOpenLoadModal}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>CARGAR DATOS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnLoad, { backgroundColor: '#28a745', marginLeft: 10 }]} onPress={handleOpenExportModal}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>📄 EXPORTAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnLoad, { backgroundColor: '#c0392b', marginLeft: 10 }]} onPress={handleOpenDeleteModal}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>🗑️ BORRAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnLoad, { backgroundColor: '#f1c40f', marginLeft: 10 }]} onPress={handleCleanFields}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>🧹 LIMPIAR</Text>
                    </TouchableOpacity>
                </View>
            </View>


            {/* Top Navigation */}
            <CustomNavBar navigation={navigation} activeRoute="Captura Mensual" />

            {/* Matrix Grid */}
            <ScrollView horizontal style={{ backgroundColor: colors.background }}>
                <View style={{ backgroundColor: colors.background }}>
                    {/* Header Row */}
                    <View style={[styles.row, styles.headerRow, { backgroundColor: colors.headerBackground, borderColor: colors.border }]}>
                        <Text style={[styles.cell, { width: 30, backgroundColor: colors.headerBackground, color: colors.text }]}>D</Text>
                        <Text style={[styles.cell, { width: 140, color: colors.text }]}>Operario</Text>

                        <Text style={[styles.cell, styles.timeCell, { color: colors.text }]}>Inicio</Text>
                        <Text style={[styles.cell, styles.timeCell, { color: colors.text }]}>Fin</Text>

                        <Text style={[styles.cell, { color: colors.text }]}>R. Final</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>H. Oper</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>Cambios</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>P. Punto</Text>

                        {/* Productivity Calcs - Headers */}
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>Tiros Eq</Text>
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>T.H.Prod</Text>
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>Promedio</Text>
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>75% Meta</Text>
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>Vr Pagar</Text>

                        {/* Auxiliares - Headers */}
                        <Text style={[styles.cell, { color: colors.text }]}>Mant/Aseo</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>Descanso</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>Otros</Text>
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>T.H.Aux</Text>

                        {/* Tiempos Muertos - Headers */}
                        <Text style={[styles.cell, { color: colors.text }]}>F. Trab</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>Repar</Text>
                        <Text style={[styles.cell, { color: colors.text }]}>Otros M.</Text>
                        <Text style={[styles.cell, styles.calc, { color: colors.text }]}>T.Muer</Text>

                        {/* Global Totals - Headers */}
                        <Text style={[styles.cell, styles.total, { color: colors.text }]}>T. Horas</Text>

                        {/* Text Infos - Headers */}
                        <Text style={[styles.cell, { color: colors.text }]}>Desperdicio</Text>
                        <Text style={[styles.cell, { width: 100, color: colors.text }]}>OP / Ref</Text>
                        <Text style={[styles.cell, { width: 100, color: colors.text }]}>Novedades</Text>
                    </View>

                    <ScrollView style={{ flex: 1 }}>
                        {gridData.map((day, index) => {
                            const calcs = calculateRow(day);
                            const isSelected = selectedRowIndex === index;
                            return (
                                <View
                                    key={day.rowId}
                                    style={[
                                        styles.row,
                                        { backgroundColor: isSelected ? colors.rowHover : (index % 2 === 0 ? colors.rowEven : colors.rowOdd) },
                                        isSelected && styles.selectedRow
                                    ]}
                                    onClick={() => handleRowClick(index)}
                                >
                                    <Text
                                        style={[styles.cell, { width: 30, backgroundColor: colors.headerBackground, color: colors.text, cursor: 'pointer' }]}
                                        onContextMenu={(e) => handleContextMenu(e, index)}
                                    >
                                        {day.day}
                                    </Text>

                                    {/* Operario Selector per Row */}
                                    <select
                                        value={day.operarioId || ''}
                                        disabled={!selectedMaquina}
                                        onChange={(e) => {
                                            const newVal = e.target.value ? parseInt(e.target.value) : null;
                                            updateDay(index, 'operarioId', newVal);
                                        }}
                                        style={{
                                            width: 140, height: 30, fontSize: 9,
                                            opacity: !selectedMaquina ? 0.5 : 1,
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            borderColor: colors.border
                                        }}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                                    </select>

                                    <TextInput
                                        style={[styles.cell, styles.timeCell, { color: colors.text, backgroundColor: colors.inputBackground }]}
                                        value={getDisplayTime(day.horaInicio)}
                                        onChangeText={t => handleTimeInput(index, 'horaInicio', t)}
                                        placeholder="HH:MM"
                                        placeholderTextColor={colors.subText}
                                        maxLength={8}
                                        editable={!!selectedMaquina}
                                    />
                                    <TextInput
                                        style={[styles.cell, styles.timeCell, { color: colors.text, backgroundColor: colors.inputBackground }]}
                                        value={getDisplayTime(day.horaFin)}
                                        onChangeText={t => handleTimeInput(index, 'horaFin', t)}
                                        placeholder="HH:MM"
                                        placeholderTextColor={colors.subText}
                                        maxLength={8}
                                        editable={!!selectedMaquina}
                                    />

                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.rFinal}
                                        onChangeText={t => handleNumericInput(index, 'rFinal', t)}
                                        onBlur={() => updateDay(index, 'rFinal', formatNumber(day.rFinal))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.horasOp}
                                        onChangeText={t => handleNumericInput(index, 'horasOp', t)}
                                        onBlur={() => updateDay(index, 'horasOp', formatNumber(day.horasOp))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.cambios}
                                        onChangeText={t => handleNumericInput(index, 'cambios', t)}
                                        onBlur={() => updateDay(index, 'cambios', formatNumber(day.cambios))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.puestaPunto}
                                        onChangeText={t => handleNumericInput(index, 'puestaPunto', t)}
                                        onBlur={() => updateDay(index, 'puestaPunto', formatNumber(day.puestaPunto))}
                                        editable={!!selectedMaquina} />

                                    {/* Productivity Calcs */}
                                    <Text style={[styles.cell, styles.calc]}>{formatNumber(calcs.TirosEquivalentes?.toFixed(0))}</Text>
                                    <Text style={[styles.cell, styles.calc]}>{calcs.TotalHorasProd?.toFixed(2)}</Text>
                                    <Text style={[styles.cell, styles.calc]}>{calcs.Promedio?.toFixed(1)}</Text>
                                    <Text style={[styles.cell, styles.calc]}>{formatNumber(calcs.Meta75Diff?.toFixed(0))}</Text>
                                    <Text style={[styles.cell, styles.calc, { color: 'green' }]}>{formatNumber(calcs.VrPagar?.toFixed(0))}</Text>

                                    {/* Auxiliares */}
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.mantenimiento}
                                        onChangeText={t => handleNumericInput(index, 'mantenimiento', t)}
                                        onBlur={() => updateDay(index, 'mantenimiento', formatNumber(day.mantenimiento))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.descansos}
                                        onChangeText={t => handleNumericInput(index, 'descansos', t)}
                                        onBlur={() => updateDay(index, 'descansos', formatNumber(day.descansos))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.otrosAux}
                                        onChangeText={t => handleNumericInput(index, 'otrosAux', t)}
                                        onBlur={() => updateDay(index, 'otrosAux', formatNumber(day.otrosAux))}
                                        editable={!!selectedMaquina} />
                                    <Text style={[styles.cell, styles.calc]}>{calcs.TotalAux?.toFixed(2)}</Text>

                                    {/* Tiempos Muertos */}
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.faltaTrabajo}
                                        onChangeText={t => handleNumericInput(index, 'faltaTrabajo', t)}
                                        onBlur={() => updateDay(index, 'faltaTrabajo', formatNumber(day.faltaTrabajo))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.reparacion}
                                        onChangeText={t => handleNumericInput(index, 'reparacion', t)}
                                        onBlur={() => updateDay(index, 'reparacion', formatNumber(day.reparacion))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.otroMuerto}
                                        onChangeText={t => handleNumericInput(index, 'otroMuerto', t)}
                                        onBlur={() => updateDay(index, 'otroMuerto', formatNumber(day.otroMuerto))}
                                        editable={!!selectedMaquina} />
                                    <Text style={[styles.cell, styles.calc]}>{calcs.TotalMuertos?.toFixed(2)}</Text>

                                    {/* Global Total */}
                                    <Text style={[styles.cell, styles.total]}>{calcs.TotalHoras?.toFixed(2)}</Text>

                                    {/* Extras */}
                                    <TextInput style={[styles.cell, { color: colors.text, backgroundColor: colors.inputBackground }]} keyboardType="numeric" value={day.desperdicio}
                                        onChangeText={t => handleNumericInput(index, 'desperdicio', t)}
                                        onBlur={() => updateDay(index, 'desperdicio', formatNumber(day.desperdicio))}
                                        editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { width: 100, color: colors.text, backgroundColor: colors.inputBackground }]} value={day.referenciaOP} onChangeText={t => updateDay(index, 'referenciaOP', t)} editable={!!selectedMaquina} />
                                    <TextInput style={[styles.cell, { width: 100, color: colors.text, backgroundColor: colors.inputBackground }]} value={day.novedades} onChangeText={t => updateDay(index, 'novedades', t)} editable={!!selectedMaquina} />
                                </View>
                            );
                        })}

                        {/* Totales Row */}
                        {(() => {
                            let sumTirosEq = 0;
                            let sumHorasProd = 0;
                            let sumVrPagar = 0;
                            let sumMeta75 = 0; // Initialize
                            let sumAux = 0;
                            let sumMuertos = 0;
                            let sumTotalHoras = 0;

                            gridData.forEach(day => {
                                const c = calculateRow(day);
                                sumTirosEq += c.TirosEquivalentes || 0;
                                sumHorasProd += c.TotalHorasProd || 0;
                                sumVrPagar += c.VrPagar || 0; // This is now positive-only from calculateRow if I changed it? No, calculateRow logic for VrPagar was: const VrPagar = VrTiroRaw; which can be negative. But the loop displays (sumVrPagar > 0 ? sumVrPagar : 0) later.
                                // Wait, in the loop I should sum raw values or positive values?
                                // If I want the total to reflect the sum of what's paid:
                                // "VrPagar" property in calculateRow is now the RAW value (including negatives).
                                // So sumVrPagar will be the net sum (positives and negatives canceling out).
                                // Usually for payment totals you only sum positive payable amounts. 
                                // But let's stick to fixing the reference error first. The user asked "quita los -75000... o si es mayor se ponga el valor". This applied to the display.
                                // I will sum the RAW values for now, but to be safe effectively "Pagar" usually implies summing only > 0.
                                // However, let's just fix the ReferenceError first.

                                sumMeta75 += c.Meta75Diff || 0;
                                sumAux += c.TotalAux || 0;
                                sumMuertos += c.TotalMuertos || 0;
                                sumTotalHoras += c.TotalHoras || 0;
                            });

                            const avgPromedio = sumHorasProd > 0 ? (sumTirosEq / sumHorasProd) : 0;

                            return (
                                <View style={[styles.row, { backgroundColor: '#d1e7dd', borderTopWidth: 2, borderColor: '#0f5132' }]}>
                                    {/* Merged Cell for "TOTALES" covering D and Operario columns */}
                                    <View style={[styles.cell, { width: 170, backgroundColor: '#d1e7dd', justifyContent: 'center' }]} >
                                        <Text style={{ fontWeight: 'bold', color: '#000' }}>TOTALES</Text>
                                    </View>

                                    <View style={[styles.cell, styles.timeCell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, styles.timeCell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />

                                    {/* Calculated Totals */}
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: '#000' }]}>{sumTirosEq.toFixed(0)}</Text>
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: '#000' }]}>{sumHorasProd.toFixed(2)}</Text>
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: '#000' }]}>{avgPromedio.toFixed(1)}</Text>
                                    {/* Show 75% Meta Sum */}
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: sumMeta75 < 0 ? 'red' : 'black' }]}>{sumMeta75.toFixed(0)}</Text>
                                    {/* Vr Pagar only positive sum */}
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: 'green' }]}>{(sumVrPagar > 0 ? sumVrPagar : 0).toFixed(0)}</Text>

                                    {/* Aux Totals */}
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: '#000' }]}>{sumAux.toFixed(2)}</Text>

                                    {/* Muertos Totals */}
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <Text style={[styles.cell, styles.calc, { fontWeight: 'bold', color: '#000' }]}>{sumMuertos.toFixed(2)}</Text>

                                    {/* Grand Total */}
                                    <Text style={[styles.cell, styles.total, { fontWeight: 'bold', backgroundColor: '#a3cfbb' }]}>{sumTotalHoras.toFixed(2)}</Text>

                                    {/* Empty padding for last columns */}
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd' }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd', width: 100 }]} />
                                    <View style={[styles.cell, { backgroundColor: '#d1e7dd', width: 100 }]} />
                                </View>
                            );
                        })()}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={handleSaveMonth} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>GUARDAR TODO</Text>
                )}
            </TouchableOpacity>

            {/* Context Menu */}
            {
                contextMenu.visible && (
                    <View style={[styles.contextMenu, { left: contextMenu.x, top: contextMenu.y }]}>
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleDuplicateRow}>
                            <Text style={{ color: '#333' }}>📋 Duplicar día</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleDeleteRow}>
                            <Text style={{ color: '#dc3545' }}>🗑️ Eliminar fila</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contextMenuItem} onPress={closeContextMenu}>
                            <Text style={{ color: '#999' }}>❌ Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                )
            }

            {/* Modal para cargar datos */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Cargar Datos - {mes}/{anio}</Text>

                        {/* Tabs */}
                        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                            <TouchableOpacity
                                style={[styles.modalTab, modalTab === 'operario' && styles.modalTabActive]}
                                onPress={() => setModalTab('operario')}
                            >
                                <Text style={modalTab === 'operario' ? styles.modalTabTextActive : styles.modalTabText}>Por Operario</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalTab, modalTab === 'maquina' && styles.modalTabActive]}
                                onPress={() => setModalTab('maquina')}
                            >
                                <Text style={modalTab === 'maquina' ? styles.modalTabTextActive : [styles.modalTabText, { color: colors.text }]}>Por Máquina</Text>
                            </TouchableOpacity>
                        </View>

                        {modalTab === 'operario' ? (
                            // Lista por Operario
                            operariosConDatos.length === 0 ? (
                                <Text style={styles.modalEmpty}>No hay datos guardados para este mes/año</Text>
                            ) : (
                                <FlatList
                                    data={operariosConDatos}
                                    keyExtractor={(item, idx) => `${item.usuarioId}-${item.maquinaId}-${idx}`}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.modalItem}
                                            onPress={() => handleSelectFromModal(item)}
                                        >
                                            <Text style={styles.modalItemTitle}>{item.usuarioNombre}</Text>
                                            <Text style={styles.modalItemSub}>Máquina: {item.maquinaNombre}</Text>
                                            <Text style={styles.modalItemSub}>{item.diasRegistrados} días registrados</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )
                        ) : (
                            // Lista por Máquina
                            maquinasConDatos.length === 0 ? (
                                <Text style={styles.modalEmpty}>No hay datos guardados para este mes/año</Text>
                            ) : (
                                <FlatList
                                    data={maquinasConDatos}
                                    keyExtractor={(item) => `maq-${item.maquinaId}`}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.modalItem}
                                            onPress={() => handleLoadByMachine(item.maquinaId)}
                                        >
                                            <Text style={styles.modalItemTitle}>{item.maquinaNombre}</Text>
                                            <Text style={styles.modalItemSub}>{item.diasRegistrados} registros</Text>
                                            <Text style={styles.modalItemSub}>{item.operariosDistintos} operario(s) distintos</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )
                        )}

                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>CERRAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Export Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={exportModalVisible}
                onRequestClose={() => setExportModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: 400, backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>📄 Exportar Datos</Text>

                        {periodosDisponibles.length === 0 ? (
                            <Text style={styles.modalEmpty}>No hay periodos con datos</Text>
                        ) : (
                            <>
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 5, color: colors.text }}>Periodo:</Text>
                                    <select
                                        value={`${exportMes}-${exportAnio}`}
                                        onChange={(e) => {
                                            const [m, a] = e.target.value.split('-');
                                            setExportMes(parseInt(m));
                                            setExportAnio(parseInt(a));
                                        }}
                                        style={{ padding: 10, fontSize: 14, width: '100%' }}
                                    >
                                        {periodosDisponibles.map(p => (
                                            <option key={`${p.mes}-${p.anio}`} value={`${p.mes}-${p.anio}`}>
                                                {getMesNombre(p.mes)} {p.anio} ({p.totalRegistros} registros)
                                            </option>
                                        ))}
                                    </select>
                                </View>

                                <View style={{ marginBottom: 15 }}>
                                    <Text style={{ fontWeight: 'bold', marginBottom: 5, color: colors.text }}>Formato:</Text>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TouchableOpacity
                                            style={[styles.modalTab, exportFormat === 'csv' && styles.modalTabActive]}
                                            onPress={() => setExportFormat('csv')}
                                        >
                                            <Text style={exportFormat === 'csv' ? styles.modalTabTextActive : styles.modalTabText}>CSV</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalTab, exportFormat === 'excel' && styles.modalTabActive]}
                                            onPress={() => setExportFormat('excel')}
                                        >
                                            <Text style={exportFormat === 'excel' ? styles.modalTabTextActive : styles.modalTabText}>Excel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.btnLoad, { backgroundColor: '#28a745', marginBottom: 10 }]}
                                    onPress={handleExport}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>DESCARGAR</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setExportModalVisible(false)}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>CERRAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="slide" onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>🗑️ Borrar Datos - {mes}/{anio}</Text>

                        {/* Tabs */}
                        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                            <TouchableOpacity
                                style={[styles.modalTab, deleteOption === 'operario' && styles.modalTabActive]}
                                onPress={() => setDeleteOption('operario')}
                            >
                                <Text style={deleteOption === 'operario' ? styles.modalTabTextActive : styles.modalTabText}>Por Operario</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalTab, deleteOption === 'maquina' && styles.modalTabActive]}
                                onPress={() => setDeleteOption('maquina')}
                            >
                                <Text style={deleteOption === 'maquina' ? styles.modalTabTextActive : styles.modalTabText}>Por Máquina</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ marginBottom: 10, fontStyle: 'italic', fontSize: 12, color: '#666', textAlign: 'center' }}>Toca un ítem para eliminar sus datos permanentemente.</Text>

                        {deleteOption === 'operario' ? (
                            operariosConDatos.length === 0 ? (
                                <Text style={styles.modalEmpty}>No hay datos para borrar en este mes</Text>
                            ) : (
                                <FlatList
                                    data={operariosConDatos}
                                    keyExtractor={(item, idx) => `del-op-${item.usuarioId}-${idx}`}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.modalItem, { borderColor: '#ffcccc', backgroundColor: '#fff5f5' }]}
                                            onPress={() => confirmDelete(item.usuarioId, 'operario', item.usuarioNombre)}
                                        >
                                            <Text style={[styles.modalItemTitle, { color: '#c0392b' }]}>{item.usuarioNombre}</Text>
                                            <Text style={styles.modalItemSub}>Máquina: {item.maquinaNombre}</Text>
                                            <Text style={styles.modalItemSub}>{item.diasRegistrados} días registrados</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )
                        ) : (
                            maquinasConDatos.length === 0 ? (
                                <Text style={styles.modalEmpty}>No hay datos para borrar en este mes</Text>
                            ) : (
                                <FlatList
                                    data={maquinasConDatos}
                                    keyExtractor={(item) => `del-maq-${item.maquinaId}`}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.modalItem, { borderColor: '#ffcccc', backgroundColor: '#fff5f5' }]}
                                            onPress={() => confirmDelete(item.maquinaId, 'maquina', item.maquinaNombre)}
                                        >
                                            <Text style={[styles.modalItemTitle, { color: '#c0392b' }]}>{item.maquinaNombre}</Text>
                                            <Text style={styles.modalItemSub}>{item.diasRegistrados} registros</Text>
                                            <Text style={styles.modalItemSub}>{item.operariosDistintos} operario(s) distintos</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )
                        )}

                        <TouchableOpacity style={[styles.modalCloseBtn, { marginTop: 10 }]} onPress={() => setDeleteModalVisible(false)} disabled={isDeleting}>
                            {isDeleting ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>CERRAR</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { padding: 10, backgroundColor: '#f0f0f0', borderBottomWidth: 1 },
    pickerBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    picker: { flex: 1, height: 40, backgroundColor: 'white', marginLeft: 10 },
    logoContainer: { marginRight: 15 },
    logo: { width: 50, height: 50 },
    row: { flexDirection: 'row', alignItems: 'center' },
    headerRow: { backgroundColor: '#ddd', height: 45 },
    cell: { width: 70, textAlign: 'center', borderWidth: 0.5, borderColor: '#bbb', height: 40, padding: 5, fontSize: 11, justifyContent: 'center', backgroundColor: 'white' },
    inputSm: { borderWidth: 1, width: 60, padding: 5, marginHorizontal: 5, textAlign: 'center', backgroundColor: 'white', borderColor: '#999' },
    calc: { backgroundColor: '#e6f7ff', fontWeight: 'bold', color: '#004085' },
    total: { backgroundColor: '#d4edda', fontWeight: 'bold', color: '#155724' },
    fab: {
        position: 'absolute', bottom: 20, right: 20,
        backgroundColor: '#28a745', padding: 15, borderRadius: 30, elevation: 5,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84
    },
    btnLoad: {
        backgroundColor: '#007bff', padding: 10, borderRadius: 5, marginLeft: 15
    },
    // Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
    },
    modalContent: {
        backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%'
    },
    modalTitle: {
        fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center'
    },
    modalEmpty: {
        textAlign: 'center', color: '#777', padding: 20
    },
    modalItem: {
        padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    modalItemTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#333'
    },
    modalItemSub: {
        fontSize: 12, color: '#666'
    },
    modalCloseBtn: {
        backgroundColor: '#dc3545', padding: 12, borderRadius: 5, marginTop: 15, alignItems: 'center'
    },
    // Time Cell Style
    timeCell: {
        width: 70, fontSize: 9, backgroundColor: '#e8f4fd'
    },
    // Context Menu Styles
    contextMenu: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
        minWidth: 150
    },
    contextMenuItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    // Selected Row Style (using outline to avoid layout shift)
    selectedRow: {
        backgroundColor: '#fff3cd',
        outlineWidth: 2,
        outlineColor: '#ffc107',
        outlineStyle: 'solid'
    },
    // Modal Tab Styles
    modalTab: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    modalTabActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff'
    },
    modalTabText: {
        color: '#333'
    },
    modalTabTextActive: {
        color: 'white',
        fontWeight: 'bold'
    },
    // Delete Modal Specific
    tabButton: { padding: 10, borderBottomWidth: 2, borderColor: 'transparent', flex: 1, alignItems: 'center' },
    tabActive: { borderColor: '#007bff' },
    tabText: { color: '#555' },
    tabTextActive: { color: '#007bff', fontWeight: 'bold' },
    modalSelect: { padding: 8, width: '100%', borderRadius: 4, borderColor: '#ccc', borderWidth: 1, marginBottom: 10 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
    modalBtn: { padding: 10, borderRadius: 5, minWidth: 100, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' },
    btnCancel: { backgroundColor: '#999' }
});
