/**
 * AnthropometryManager - Gestión de datos antropométricos
 * Maneja el almacenamiento y recuperación de registros antropométricos usando IndexedDB
 */

export class AnthropometryManager {
    constructor() {
        this.dbName = 'GymTrackerAnthropometryDB';
        this.dbVersion = 1;
        this.storeName = 'anthropometricRecords';
        this.db = null;
    }

    /**
     * Inicializa la base de datos IndexedDB
     */
    async initDB() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object store si no existe
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    
                    // Crear índices
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('weight', 'weight', { unique: false });
                    store.createIndex('bmi', 'bmi', { unique: false });
                }
            };
        });
    }

    /**
     * Guarda un registro antropométrico
     * @param {Object} record - Registro antropométrico
     */
    async saveRecord(record) {
        const db = await this.initDB();
        
        // Validar y limpiar el registro
        const cleanRecord = this.validateAndCleanRecord(record);
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.put(cleanRecord);
            
            request.onsuccess = () => resolve(cleanRecord);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtiene un registro por ID
     * @param {string} id - ID del registro
     */
    async getRecord(id) {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtiene todos los registros ordenados por fecha
     */
    async getAllRecords() {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('date');
            
            const request = index.getAll();
            
            request.onsuccess = () => {
                const records = request.result;
                // Ordenar por fecha descendente (más reciente primero)
                records.sort((a, b) => new Date(b.date) - new Date(a.date));
                resolve(records);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtiene el registro más reciente
     */
    async getLatestRecord() {
        const records = await this.getAllRecords();
        return records.length > 0 ? records[0] : null;
    }

    /**
     * Obtiene registros para un período específico
     * @param {string|number} period - Período en días o 'all' para todos
     */
    async getRecordsForPeriod(period) {
        const records = await this.getAllRecords();
        
        if (period === 'all') return records;
        
        const days = parseInt(period);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return records.filter(record => new Date(record.date) >= cutoffDate);
    }

    /**
     * Elimina un registro
     * @param {string} id - ID del registro a eliminar
     */
    async deleteRecord(id) {
        const db = await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtiene estadísticas de progreso
     * @param {string} metric - Métrica a analizar (weight, bmi, etc.)
     * @param {number} days - Días hacia atrás para analizar
     */
    async getProgressStats(metric, days = 30) {
        const records = await this.getRecordsForPeriod(days);
        
        if (records.length < 2) {
            return {
                trend: 'insufficient_data',
                change: 0,
                changePercent: 0,
                records: records.length
            };
        }

        const values = this.extractMetricValues(records, metric);
        
        if (values.length < 2) {
            return {
                trend: 'insufficient_data',
                change: 0,
                changePercent: 0,
                records: values.length
            };
        }

        const first = values[values.length - 1]; // Más antiguo
        const last = values[0]; // Más reciente
        const change = last - first;
        const changePercent = (change / first) * 100;

        let trend = 'stable';
        if (Math.abs(changePercent) > 1) {
            trend = change > 0 ? 'increasing' : 'decreasing';
        }

        return {
            trend,
            change,
            changePercent,
            records: values.length,
            first,
            last
        };
    }

    /**
     * Exporta todos los registros como JSON
     */
    async exportData() {
        const records = await this.getAllRecords();
        
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            records: records
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Importa registros desde JSON
     * @param {string} jsonData - Datos en formato JSON
     */
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.records || !Array.isArray(data.records)) {
                throw new Error('Formato de datos inválido');
            }

            const results = [];
            
            for (const record of data.records) {
                try {
                    const savedRecord = await this.saveRecord(record);
                    results.push({ success: true, record: savedRecord });
                } catch (error) {
                    results.push({ success: false, error: error.message, record });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Error al importar datos: ${error.message}`);
        }
    }

    /**
     * Valida y limpia un registro antropométrico
     * @param {Object} record - Registro a validar
     */
    validateAndCleanRecord(record) {
        const cleaned = {
            id: record.id || this.generateId(),
            date: record.date || new Date().toISOString().split('T')[0],
            weight: this.validateNumber(record.weight, 30, 300),
            height: this.validateNumber(record.height, 100, 250),
            circumferences: {},
            bodyComposition: {},
            healthMetrics: {},
            notes: record.notes || null
        };

        // Validar circunferencias
        if (record.circumferences) {
            cleaned.circumferences = {
                neck: this.validateNumber(record.circumferences.neck, 25, 60),
                chest: this.validateNumber(record.circumferences.chest, 60, 150),
                waist: this.validateNumber(record.circumferences.waist, 50, 150),
                hip: this.validateNumber(record.circumferences.hip, 60, 150),
                armRight: this.validateNumber(record.circumferences.armRight, 20, 60),
                armLeft: this.validateNumber(record.circumferences.armLeft, 20, 60),
                thighRight: this.validateNumber(record.circumferences.thighRight, 30, 80),
                thighLeft: this.validateNumber(record.circumferences.thighLeft, 30, 80),
                calfRight: this.validateNumber(record.circumferences.calfRight, 20, 50),
            };
        }

        // Validar composición corporal
        if (record.bodyComposition) {
            cleaned.bodyComposition = {
                muscleMassPercentage: this.validateNumber(record.bodyComposition.muscleMassPercentage, 20, 60),
                bodyFatPercentage: this.validateNumber(record.bodyComposition.bodyFatPercentage, 3, 50),
                waterPercentage: this.validateNumber(record.bodyComposition.waterPercentage, 40, 75),
                boneMass: this.validateNumber(record.bodyComposition.boneMass, 1, 10),
                basalMetabolism: this.validateNumber(record.bodyComposition.basalMetabolism, 800, 3000),
            };
        }

        // Validar métricas de salud
        if (record.healthMetrics) {
            cleaned.healthMetrics = {
                restingHeartRate: this.validateNumber(record.healthMetrics.restingHeartRate, 40, 120),
                bloodPressureSystolic: this.validateNumber(record.healthMetrics.bloodPressureSystolic, 80, 200),
                bloodPressureDiastolic: this.validateNumber(record.healthMetrics.bloodPressureDiastolic, 40, 130),
                maxHeartRate: this.validateNumber(record.healthMetrics.maxHeartRate, 100, 220),
            };
        }

        // Calcular IMC si hay peso y altura
        if (cleaned.weight && cleaned.height) {
            cleaned.bmi = cleaned.weight / Math.pow(cleaned.height / 100, 2);
        }

        return cleaned;
    }

    /**
     * Valida un número dentro de un rango
     * @param {any} value - Valor a validar
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     */
    validateNumber(value, min, max) {
        const num = parseFloat(value);
        if (isNaN(num) || num < min || num > max) {
            return null;
        }
        return num;
    }

    /**
     * Extrae valores de una métrica específica de los registros
     * @param {Array} records - Array de registros
     * @param {string} metric - Métrica a extraer
     */
    extractMetricValues(records, metric) {
        const values = [];
        
        records.forEach(record => {
            let value = null;
            
            switch (metric) {
                case 'weight':
                    value = record.weight;
                    break;
                case 'bmi':
                    value = record.bmi;
                    break;
                case 'bodyFat':
                    value = record.bodyComposition?.bodyFatPercentage;
                    break;
                case 'muscleMass':
                    value = record.bodyComposition?.muscleMassPercentage;
                    break;
                case 'waist':
                    value = record.circumferences?.waist;
                    break;
                case 'chest':
                    value = record.circumferences?.chest;
                    break;
                case 'hip':
                    value = record.circumferences?.hip;
                    break;
            }
            
            if (value !== null && value !== undefined) {
                values.push(value);
            }
        });
        
        return values;
    }

    /**
     * Genera un ID único
     */
    generateId() {
        return `anthro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calcula el IMC
     * @param {number} weight - Peso en kg
     * @param {number} height - Altura en cm
     */
    static calculateBMI(weight, height) {
        if (!weight || !height) return null;
        return weight / Math.pow(height / 100, 2);
    }

    /**
     * Obtiene la categoría del IMC
     * @param {number} bmi - Valor del IMC
     */
    static getBMICategory(bmi) {
        if (!bmi) return null;
        
        if (bmi < 18.5) return 'underweight';
        if (bmi < 25) return 'normal';
        if (bmi < 30) return 'overweight';
        return 'obese';
    }

    /**
     * Formatea un valor numérico con unidades
     * @param {number} value - Valor a formatear
     * @param {string} unit - Unidad
     * @param {number} decimals - Número de decimales
     */
    static formatValue(value, unit = '', decimals = 1) {
        if (value === null || value === undefined) return '--';
        return `${value.toFixed(decimals)}${unit}`;
    }
}
