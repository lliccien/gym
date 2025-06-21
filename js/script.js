document.addEventListener('DOMContentLoaded', () => {
            // --- FUNCIÓN PARA CONVERTIR NOMBRES A FORMATO DE ARCHIVO ---
            const toImageName = (name) => name.toLowerCase().replace(/ \/ /g, '-').replace(/ & /g, '-').replace(/ /g, '-');

            // --- CÁLCULO DE CALORÍAS (APROXIMADO) ---
            function calculateCalories(sets, reps, weight) {
                if (sets <= 0 || reps <= 0 || weight <= 0) return 0;
                const volume = sets * reps * weight;
                const calories = Math.round(volume * 0.035);
                return calories > 0 ? calories : 1;
            }

            function calculateCardioCalories(type, durationInMinutes) {
                // Valores MET (Metabolic Equivalent of Task) para diferentes tipos de cardio
                const metValues = {
                    'Caminadora': 7.5,  // Caminadora a ritmo moderado
                    'Bicicleta': 8.0,   // Bicicleta estacionaria a ritmo moderado
                    'Elíptica': 8.5,     // Elíptica a ritmo moderado
                    'Descanso': 0       // Día de descanso (sin calorías)
                };
                
                if (type === 'Descanso' || durationInMinutes <= 0) return 0;
                
                const met = metValues[type] || 8.0; // Valor predeterminado si no se encuentra el tipo
                const bodyWeightKg = 70; // Un peso corporal promedio como referencia
                return Math.round(met * 3.5 * bodyWeightKg / 200 * durationInMinutes);
            }

            function extractCardioInfoFromString(cardioString) {
                const typeRegex = /(Caminadora|Bicicleta|Elíptica)/i;
                const durationRegex = /\((\d+)\s*min\)/;
                
                const typeMatch = cardioString.match(typeRegex);
                const durationMatch = cardioString.match(durationRegex);
                
                const type = typeMatch ? typeMatch[1] : 'Caminadora';
                const duration = durationMatch ? parseInt(durationMatch[1], 10) : 15;
                
                return { type, duration };
            }

            // --- UTILIDADES DE FECHA ---
            function getTodayDateString() {
                // Obtiene la fecha actual en la zona horaria local del usuario
                const today = new Date();
                
                // Formatea la fecha como YYYY-MM-DD
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                
                // Retorna la fecha en formato ISO (YYYY-MM-DDT00:00:00.000Z)
                // pero usando 12:00 para evitar problemas de cambio de día por zona horaria
                return `${year}-${month}-${day}T12:00:00.000Z`;
            }
            
            function formatLocalDate(dateString) {
                // Convierte una fecha en formato ISO a un objeto Date
                const date = new Date(dateString);
                
                // Formatea la fecha según la configuración regional del navegador
                return date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }

            // --- ESTRUCTURA DE LA RUTINA ---
            const routine = {
                1: { name: "Piernas & Glúteos", cardio: { type: "Caminadora", duration: 15 }, exercises: ["Ultra Leg Press", "Ultra Leg Extension", "Ultra Glute", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                2: { name: "Pecho, Hombros & Tríceps", cardio: { type: "Bicicleta", duration: 15 }, exercises: ["Ultra Converging Chest Press", "Ultra Converging Shoulder Press", "Ultra Triceps Press", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                3: { name: "Espalda & Bíceps", cardio: { type: "Elíptica", duration: 15 }, exercises: ["Ultra Diverging Lat Pulldown", "Ultra Diverging Seated Row", "Ultra Independent Biceps Curl", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                4: { name: "Piernas (Variante)", cardio: { type: "Caminadora", duration: 15 }, exercises: ["Ultra Seated Leg Curl", "Ultra Hip Abductor", "Ultra Calf Extension", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                5: { name: "Full Body Ligero + Definición", cardio: { type: "Elíptica", duration: 20 }, exercises: ["Ultra Pec Fly Rear Delt", "Ultra Converging Shoulder Press", "Ultra Glute", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                0: { name: "Día de Descanso", cardio: { type: "Descanso", duration: 0 }, exercises: [] },
                6: { name: "Día de Descanso", cardio: { type: "Descanso", duration: 0 }, exercises: [] }
            };

            // --- MAPA DE EJERCICIOS A GRUPOS MUSCULARES ---
            const exerciseMuscleGroups = {
                "Ultra Leg Press": "Piernas/Glúteos", "Ultra Leg Extension": "Cuádriceps", "Ultra Glute": "Glúteos",
                "Ultra Abdominal Crunch": "Abdominales", "Ultra Back Extension": "Espalda Baja", "Ultra Converging Chest Press": "Pecho",
                "Ultra Converging Shoulder Press": "Hombros", "Ultra Triceps Press": "Tríceps", "Ultra Diverging Lat Pulldown": "Espalda (Dorsales)",
                "Ultra Diverging Seated Row": "Espalda (Romboides)", "Ultra Independent Biceps Curl": "Bíceps", "Ultra Seated Leg Curl": "Isquiotibiales",
                "Ultra Hip Abductor": "Abductores", "Ultra Calf Extension": "Pantorrillas", "Ultra Pec Fly Rear Delt": "Pecho / Deltoides Post."
            };

            let db;
            let currentRoutineId = null;

            // --- ELEMENTOS DEL DOM ---
            const tabToday = document.getElementById('tab-today');
            const tabHistory = document.getElementById('tab-history');
            const viewToday = document.getElementById('view-today');
            const viewHistory = document.getElementById('view-history');
            const imageModal = document.getElementById('image-modal');
            const modalImage = document.getElementById('modal-image');
            const modalClose = document.getElementById('modal-close');
            const routineSelect = document.getElementById('routine-select');
            const loadRoutineBtn = document.getElementById('load-routine-btn');
            const historyContainer = document.getElementById('history-container');
            
            // Estos elementos se inicializarán dinámicamente después de crear la interfaz
            let cardioTypeSelect;
            let cardioTimeSelect;
            let cardioCaloriesInput;
            let registerCardioBtn;
            let cardioSection;
            let cardioRecommendation;

            // --- CONFIGURACIÓN DE INDEXEDDB ---
            function setupDB() {
                const request = indexedDB.open('gymTrackerDB', 4); // <--- VERSIÓN 4
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    
                    // Verificar si el almacén de objetos 'workouts' existe
                    if (!db.objectStoreNames.contains('workouts')) {
                        const store = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
                        store.createIndex('date', 'date', { unique: false });
                        store.createIndex('routineId', 'routineId', { unique: false });
                    } else {
                        try {
                            const store = e.target.transaction.objectStore('workouts');
                            // Asegurarse de que los índices existan
                            if (!store.indexNames.contains('routineId')) {
                                store.createIndex('routineId', 'routineId', { unique: false });
                            }
                        } catch (err) {
                            console.error('Error al actualizar workouts:', err);
                        }
                    }
                    
                    // Asegurarse de que el almacén 'cardio' existe
                    if (!db.objectStoreNames.contains('cardio')) {
                        const cardioStore = db.createObjectStore('cardio', { keyPath: 'id', autoIncrement: true });
                        cardioStore.createIndex('date', 'date', { unique: false });
                        cardioStore.createIndex('routineId', 'routineId', { unique: false });
                    }
                };
                request.onsuccess = (e) => {
                    db = e.target.result;
                    populateRoutineSelector();
                    
                    // Obtener el día de la semana usando la fecha local del usuario
                    const today = new Date();
                    const todayIndex = today.getDay(); // 0-6 (Domingo-Sábado)
                    
                    routineSelect.value = todayIndex;
                    displayWorkout(todayIndex);
                    
                    // Verificar si ya hay cardio registrado para hoy
                    checkTodayCardio();
                    
                    // Verificar si ya hay ejercicios registrados para hoy
                    checkTodayExercises();
                };
                request.onerror = (e) => console.error('Error al abrir IndexedDB:', e.target.errorCode);
            }

            // --- LÓGICA DE LA INTERFAZ (UI) ---
            function switchView(viewToShow) {
                viewHistory.classList.toggle('hidden', viewToShow !== 'history');
                viewToday.classList.toggle('hidden', viewToShow === 'history');
                tabHistory.classList.toggle('tab-active', viewToShow === 'history');
                tabToday.classList.toggle('tab-active', viewToShow !== 'history');
                if (viewToShow === 'history') displayHistory();
            }

            tabToday.addEventListener('click', () => switchView('today'));
            tabHistory.addEventListener('click', () => switchView('history'));

            // --- LÓGICA DE RUTINAS ---
            function populateRoutineSelector() {
                Object.keys(routine).forEach(key => {
                    if (routine[key].exercises.length > 0) {
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = `Día ${key}: ${routine[key].name}`;
                        routineSelect.appendChild(option);
                    }
                });
            }

            loadRoutineBtn.addEventListener('click', () => {
                const selectedRoutineId = parseInt(routineSelect.value, 10);
                displayWorkout(selectedRoutineId);
            });

            // --- MOSTRAR EJERCICIOS DE UNA RUTINA ---
            function displayWorkout(routineId) {
                currentRoutineId = routineId; // Guardar rutina actual
                const container = document.getElementById('daily-workout-container');
                const selectedRoutine = routine[routineId];
                const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                const dayName = dayNames[parseInt(routineId, 10)] || "Rutina";

                if (!selectedRoutine) {
                    container.innerHTML = '<p class="text-center text-red-500">No se encontró la rutina.</p>';
                    return;
                }
                
                // Configurar el selector de cardio con el tipo recomendado (guardamos para aplicar después)
                updateCardioSelectors(selectedRoutine.cardio);
                
                const cardioCalories = calculateCardioCalories(selectedRoutine.cardio.type, selectedRoutine.cardio.duration);
                let html = `<h3 class="text-xl md:text-2xl font-bold text-gray-800 mb-4">${dayName} - ${selectedRoutine.name}</h3>`;

                // Agregar la sección de Cardio Personalizado
                html += `
                <div id="cardio-section" class="mb-6 p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-amber-50">
                    <h3 class="text-lg font-bold text-orange-600 mb-3">Cardio Personalizado</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="flex flex-col">
                            <label class="text-sm font-medium mb-1 text-gray-700">Tipo de Cardio</label>
                            <select id="cardio-type" class="p-3 border rounded-md">
                                <option value="Caminadora">Caminadora</option>
                                <option value="Bicicleta">Bicicleta</option>
                                <option value="Elíptica">Elíptica</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="text-sm font-medium mb-1 text-gray-700">Tiempo (minutos)</label>
                            <select id="cardio-time" class="p-3 border rounded-md">
                                <option value="5">5 min</option>
                                <option value="10">10 min</option>
                                <option value="15" selected>15 min</option>
                                <option value="20">20 min</option>
                                <option value="25">25 min</option>
                                <option value="30">30 min</option>
                                <option value="35">35 min</option>
                                <option value="40">40 min</option>
                                <option value="45">45 min</option>
                            </select>
                        </div>
                        <div class="flex flex-col">
                            <label class="text-sm font-medium mb-1 text-gray-700">Calorías quemadas</label>
                            <input type="number" id="cardio-calories" class="p-3 border rounded-md" placeholder="Automático" inputmode="numeric" min="0">
                            <p class="text-xs text-gray-500 mt-1">Deja vacío para cálculo automático</p>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button id="register-cardio-btn" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md transition duration-300">
                            Registrar Cardio
                        </button>
                    </div>
                    <div id="cardio-recommendation" class="hidden">
                    </div>
                </div>`;

                if (selectedRoutine.exercises.length > 0) {
                    html += '<div class="space-y-6">';
                    selectedRoutine.exercises.forEach((exerciseName, index) => {
                         const imageName = toImageName(exerciseName);
                        const muscleGroup = exerciseMuscleGroups[exerciseName] || "";
                        const displayExerciseName = muscleGroup ? `${exerciseName} - ${muscleGroup}` : exerciseName;
                        html += `
                            <div class="exercise-card p-4 border rounded-lg flex flex-col sm:flex-row items-center gap-4" id="exercise-card-${index}">
                                <div class="mb-3 sm:mb-0 w-full sm:w-auto flex justify-center">
                                    <div class="flex-shrink-0 w-32 h-32 sm:w-28 sm:h-28">
                                        <img src="images/gym/${imageName}.png" alt="Imagen de ${exerciseName}" class="exercise-image w-full h-full object-cover rounded-md bg-gray-200 cursor-pointer" onerror="this.onerror=null;this.src='https://placehold.co/128x128/e2e8f0/94a3b8?text=Sin+Imagen';">
                                    </div>
                                </div>
                                <div class="flex-grow w-full flex flex-col gap-3">
                                    <span class="font-semibold text-lg text-center sm:text-left">${displayExerciseName}</span>
                                    <div class="w-full grid grid-cols-3 gap-2 items-center">
                                        <div class="flex flex-col">
                                            <input type="number" placeholder="3-4" class="series-input w-full p-3 border rounded-md text-center" data-exercise="${exerciseName}" inputmode="numeric">
                                            <label class="text-sm font-medium text-center mt-1">series</label>
                                        </div>
                                        <div class="flex flex-col">
                                            <input type="number" placeholder="12-15" class="reps-input w-full p-3 border rounded-md text-center" data-exercise="${exerciseName}" inputmode="numeric">
                                            <label class="text-sm font-medium text-center mt-1">reps</label>
                                        </div>
                                        <div class="flex flex-col">
                                            <input type="number" placeholder="--" class="weight-input w-full p-3 border rounded-md text-center" data-exercise="${exerciseName}" step="0.01" inputmode="decimal">
                                            <label class="text-sm font-medium text-center mt-1">kg</label>
                                        </div>
                                    </div>
                                    <button class="register-btn w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 mt-2" data-exercise="${exerciseName}" data-card-id="exercise-card-${index}">Registrar</button>
                                </div>
                            </div>`;
                    });
                    html += '</div>';
                } else {
                     html += '<p class="text-center text-lg text-green-600 font-semibold py-8">¡Día de descanso!</p>';
                }
                container.innerHTML = html;
                addRegisterEventListeners();
                addImageModalListeners();
                
                // Actualizar las referencias de los elementos de cardio que ahora son dinámicos
                updateCardioElements();
                
                // Verificar si ya hay cardio registrado para hoy
                checkTodayCardio();
                
                // Verificar si ya hay ejercicios registrados para hoy
                checkTodayExercises();
            }
            
            function updateCardioElements() {
                // Actualizar las referencias a los elementos de cardio que ahora son dinámicos
                cardioTypeSelect = document.getElementById('cardio-type');
                cardioTimeSelect = document.getElementById('cardio-time');
                cardioCaloriesInput = document.getElementById('cardio-calories');
                registerCardioBtn = document.getElementById('register-cardio-btn');
                cardioSection = document.getElementById('cardio-section');
                cardioRecommendation = document.getElementById('cardio-recommendation');
                
                // Volver a agregar los event listeners
                registerCardioBtn.addEventListener('click', registerCardio);
                cardioTypeSelect.addEventListener('change', updateCardioRecommendation);
                cardioTimeSelect.addEventListener('change', () => {
                    updateCardioRecommendation();
                    
                    // Actualizar el placeholder con el cálculo aproximado de calorías
                    const type = cardioTypeSelect.value;
                    const duration = parseInt(cardioTimeSelect.value, 10);
                    const calories = calculateCardioCalories(type, duration);
                    cardioCaloriesInput.placeholder = `~${calories} Kcal`;
                });
                
                // Aplicar la configuración pendiente de cardio
                applyCardioSelectors();
            }
            
            // --- MANEJO DE CARDIO PERSONALIZADO ---
            function updateCardioSelectors(cardioInfo) {
                // Esta función se llama antes de crear la interfaz, por lo que guardamos la información
                // para aplicarla después de crear los elementos dinámicamente
                window.pendingCardioInfo = cardioInfo;
            }
            
            function applyCardioSelectors() {
                if (!window.pendingCardioInfo) return;
                
                const cardioInfo = window.pendingCardioInfo;
                
                // Actualizar tipo de cardio
                cardioTypeSelect.value = cardioInfo.type;
                
                // Actualizar tiempo de cardio
                if (cardioInfo.duration > 0 && cardioTimeSelect.querySelector(`option[value="${cardioInfo.duration}"]`)) {
                    cardioTimeSelect.value = cardioInfo.duration;
                } else {
                    cardioTimeSelect.value = "15"; // Valor por defecto
                }
                
                // Limpiar calorías manuales
                cardioCaloriesInput.value = "";
                
                // Actualizar recomendación
                updateCardioRecommendation();
            }
            
            function updateCardioRecommendation() {
                const type = cardioTypeSelect.value;
                const time = parseInt(cardioTimeSelect.value, 10);
                
                // Actualizar el placeholder de calorías
                const calories = calculateCardioCalories(type, time);
                cardioCaloriesInput.placeholder = `~${calories} Kcal`;
            }
            
            function registerCardio() {
                const type = cardioTypeSelect.value;
                const duration = parseInt(cardioTimeSelect.value, 10);
                let calories = cardioCaloriesInput.value.trim() !== "" ? 
                    parseInt(cardioCaloriesInput.value, 10) : 
                    calculateCardioCalories(type, duration);
                
                if (isNaN(calories) || calories < 0) {
                    calories = calculateCardioCalories(type, duration);
                }
                
                const cardioEntry = {
                    date: getTodayDateString(),
                    type: type,
                    duration: duration,
                    calories: calories,
                    routineId: currentRoutineId,
                    isCustom: true
                };
                
                addCardioEntry(cardioEntry);
            }
            
            function addCardioEntry(entry) {
                if (!db) return;
                const transaction = db.transaction(['cardio'], 'readwrite');
                const request = transaction.objectStore('cardio').add(entry);
                
                request.onsuccess = () => {
                    showToast('¡Cardio registrado con éxito!');
                    markCardioAsCompleted();
                };
                
                request.onerror = (e) => {
                    showToast('Error: No se pudo guardar el registro de cardio.', true);
                    console.error('Error al guardar cardio:', e.target.error);
                };
            }
            
            function deleteCardioEntry(id, callback) {
                if (!db) return;
                const transaction = db.transaction(['cardio'], 'readwrite');
                const request = transaction.objectStore('cardio').delete(id);
                
                request.onsuccess = () => {
                    showToast("Registro de cardio eliminado.");
                    callback(); // Llama al callback para refrescar el historial
                };
                
                request.onerror = (e) => console.error('Error al eliminar cardio:', e.target.error);
            }
            
            function markCardioAsCompleted() {
                // Verificar si los elementos existen
                if (!cardioSection || !registerCardioBtn || !cardioTypeSelect || !cardioTimeSelect || !cardioCaloriesInput) {
                    return;
                }
                
                cardioSection.classList.add('completed');
                registerCardioBtn.textContent = '✓ Cardio Registrado';
                registerCardioBtn.classList.add('completed');
                registerCardioBtn.disabled = true;
                
                // Eliminar información previa de calorías si existe
                const nextElement = registerCardioBtn.nextElementSibling;
                if (nextElement && nextElement.textContent.includes('Kcal')) {
                    nextElement.remove();
                }
                
                // Agregar información de calorías
                const type = cardioTypeSelect.value;
                const duration = parseInt(cardioTimeSelect.value, 10);
                let calories = cardioCaloriesInput.value.trim() !== "" ? 
                    parseInt(cardioCaloriesInput.value, 10) : 
                    calculateCardioCalories(type, duration);
                
                const calorieInfo = document.createElement('div');
                calorieInfo.className = 'text-center text-sm font-semibold text-green-600 mt-2';
                calorieInfo.textContent = `🔥 ${calories} Kcal quemadas - ${type} (${duration} min)`;
                registerCardioBtn.insertAdjacentElement('afterend', calorieInfo);
            }
            
            function checkTodayCardio() {
                if (!db) return;
                
                // Obtener la fecha de hoy (al comienzo del día) en la zona horaria local
                const todayDate = getTodayDateString().split('T')[0];
                
                // Establecer el rango para buscar registros de hoy
                const startOfDay = todayDate + 'T00:00:00.000Z';
                const endOfDay = todayDate + 'T23:59:59.999Z';
                
                const transaction = db.transaction(['cardio'], 'readonly');
                const store = transaction.objectStore('cardio');
                const index = store.index('date');
                
                const range = IDBKeyRange.bound(startOfDay, endOfDay);
                const request = index.openCursor(range);
                
                let cardioFound = false;
                
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        if (cursor.value.routineId == currentRoutineId) {
                            cardioFound = true;
                            // Actualizar la UI para mostrar el cardio como completado
                            const cardioData = cursor.value;
                            
                            // Verificar que los elementos existan antes de acceder a ellos
                            if (cardioTypeSelect && cardioTimeSelect && cardioCaloriesInput) {
                                cardioTypeSelect.value = cardioData.type;
                                cardioTimeSelect.value = cardioData.duration;
                                cardioCaloriesInput.value = cardioData.calories;
                                markCardioAsCompleted();
                            }
                        }
                        cursor.continue();
                    } else {
                        // Si no se encontró cardio para hoy, asegurarse de que la UI esté en estado "no completado"
                        if (!cardioFound && cardioSection && registerCardioBtn) {
                            cardioSection.classList.remove('completed');
                            registerCardioBtn.textContent = 'Registrar Cardio';
                            registerCardioBtn.classList.remove('completed');
                            registerCardioBtn.disabled = false;
                            
                            // Eliminar cualquier mensaje de calorías que pudiera existir
                            const nextElement = registerCardioBtn.nextElementSibling;
                            if (nextElement && nextElement.textContent.includes('Kcal')) {
                                nextElement.remove();
                            }
                        }
                    }
                };
                
                request.onerror = (e) => {
                    console.error('Error al buscar registros de cardio:', e.target.error);
                };
            }
            
            // --- MANEJO DE EVENTOS DEL MODAL DE IMAGEN ---
            function addImageModalListeners() {
                document.querySelectorAll('.exercise-image').forEach(img => {
                    img.addEventListener('click', (e) => {
                        if (e.target.src.includes('placehold.co')) return;
                        modalImage.src = e.target.src;
                        imageModal.classList.remove('hidden');
                    });
                });
            }

            function closeModal() {
                imageModal.classList.add('hidden');
                modalImage.src = "";
            }
            
            modalClose.addEventListener('click', closeModal);
            imageModal.addEventListener('click', (e) => {
                if (e.target === imageModal) closeModal();
            });

            // --- MANEJO DE EVENTOS DE REGISTRO ---
            function addRegisterEventListeners() {
                document.querySelectorAll('.register-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const exerciseName = e.target.dataset.exercise;
                        const series = parseInt(document.querySelector(`.series-input[data-exercise="${exerciseName}"]`).value, 10);
                        const reps = parseInt(document.querySelector(`.reps-input[data-exercise="${exerciseName}"]`).value, 10);
                        const weight = parseFloat(document.querySelector(`.weight-input[data-exercise="${exerciseName}"]`).value);

                        if (isNaN(series) || isNaN(reps) || isNaN(weight) || series <= 0 || reps <= 0 || weight <= 0) {
                            showToast('Por favor, ingresa valores válidos y positivos.', true);
                            return;
                        }

                        const calories = calculateCalories(series, reps, weight);
                        
                        addWorkoutEntry({
                            date: getTodayDateString(),
                            exercise: exerciseName,
                            series: series, reps: reps, weight: weight,
                            calories: calories,
                            routineId: currentRoutineId // Guardar el ID de la rutina
                        });
                        
                        const card = document.getElementById(e.target.dataset.cardId);
                        card.classList.add('bg-green-50');
                        e.target.textContent = '✓ Registrado';
                        e.target.disabled = true;
                        e.target.classList.replace('bg-blue-500', 'bg-green-600');

                        // Verificar si ya existe un elemento de calorías para evitar duplicados
                        const existingCalorieDisplay = e.target.nextElementSibling;
                        if (!existingCalorieDisplay || !existingCalorieDisplay.textContent.includes('Kcal')) {
                            const calorieDisplay = document.createElement('div');
                            calorieDisplay.className = 'text-center md:text-left text-sm font-semibold text-orange-500 mt-2';
                            calorieDisplay.textContent = `🔥 ${calories} Kcal (aprox.)`;
                            e.target.insertAdjacentElement('afterend', calorieDisplay);
                        }
                    });
                });
            }

            // --- OPERACIONES DE INDEXEDDB ---
            function addWorkoutEntry(entry) {
                if (!db) return;
                const transaction = db.transaction(['workouts'], 'readwrite');
                const request = transaction.objectStore('workouts').add(entry);
                request.onsuccess = () => showToast();
                request.onerror = (e) => showToast('Error: No se pudo guardar el registro.', true);
            }
            
            function deleteWorkoutEntry(id, callback) {
                if (!db) return;
                const transaction = db.transaction(['workouts'], 'readwrite');
                const request = transaction.objectStore('workouts').delete(id);
                request.onsuccess = () => {
                    showToast("Registro eliminado.");
                    callback(); // Llama al callback para refrescar el historial
                }
                request.onerror = (e) => console.error('Error al eliminar:', e.target.error);
            }

            // --- MOSTRAR HISTORIAL ---
            async function displayHistory() {
                if (!db) {
                    historyContainer.innerHTML = '<p>La base de datos no está disponible.</p>';
                    return;
                }
                historyContainer.innerHTML = '';

                // Obtener todas las entradas de ejercicios
                const workoutEntries = await getAllEntries('workouts');
                // Obtener todas las entradas de cardio
                const cardioEntries = await getAllEntries('cardio');
                
                if ((!workoutEntries || workoutEntries.length === 0) && (!cardioEntries || cardioEntries.length === 0)) {
                    historyContainer.innerHTML = '<p class="text-center py-8 text-gray-500">Aún no hay registros.</p>';
                    return;
                }

                // Combinar todas las entradas (ejercicios y cardio)
                const allEntries = [...workoutEntries];
                
                // Agrupar por fecha (YYYY-MM-DD)
                const groupedByDate = {};
                
                // Agrupar ejercicios por fecha
                workoutEntries.forEach(entry => {
                    const date = entry.date.split('T')[0];
                    if (!groupedByDate[date]) {
                        groupedByDate[date] = {
                            workouts: [],
                            cardio: null,
                            routineId: entry.routineId
                        };
                    }
                    groupedByDate[date].workouts.push(entry);
                });
                
                // Agrupar cardio por fecha
                cardioEntries.forEach(entry => {
                    const date = entry.date.split('T')[0];
                    if (!groupedByDate[date]) {
                        groupedByDate[date] = {
                            workouts: [],
                            cardio: entry,
                            routineId: entry.routineId
                        };
                    } else {
                        groupedByDate[date].cardio = entry;
                    }
                });

                // Ordenar fechas de más reciente a más antigua
                const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

                sortedDates.forEach(date => {
                    const entries = groupedByDate[date];
                    const routineId = entries.routineId; // Rutina del día
                    const routineInfo = routine[routineId] || { name: 'Desconocida', cardio: { type: 'Desconocido', duration: 0 }, exercises: [] };
                    
                    let totalStrengthCalories = 0;
                    let cardioCalories = 0;
                    
                    // Calcular calorías de ejercicios de fuerza
                    entries.workouts.forEach(entry => {
                        totalStrengthCalories += entry.calories || 0;
                    });
                    
                    // Calcular calorías de cardio
                    if (entries.cardio) {
                        cardioCalories = entries.cardio.calories || 0;
                    }
                    
                    // Crear un mapa de los ejercicios registrados para fácil acceso
                    const registeredExercises = {};
                    entries.workouts.forEach(entry => {
                        registeredExercises[entry.exercise] = entry;
                    });
                    
                    // Crear filas de tabla para todos los ejercicios de la rutina
                    let tableRows = '';
                    
                    // Añadir fila de cardio primero
                    const isCardioCompleted = entries.cardio !== null;
                    const cardioInfo = entries.cardio || { type: routineInfo.cardio.type, duration: routineInfo.cardio.duration };
                    
                    tableRows += `
                        <tr class="border-b ${isCardioCompleted ? 'hover:bg-blue-50' : 'bg-gray-50 text-gray-500'} transition-colors">
                            <td class="py-2 px-3 bg-gradient-to-r ${isCardioCompleted ? 'from-green-50 to-teal-50' : 'from-gray-50 to-gray-100'} font-medium" data-label="Ejercicio">
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">Cardio - ${cardioInfo.type} (${cardioInfo.duration} min)</span>
                                    ${isCardioCompleted ? `
                                        <button class="delete-cardio-btn-hist bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full p-1.5 transition-colors" data-id="${entries.cardio.id}" title="Eliminar registro de cardio">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                            <td class="py-2 px-3" data-label="Datos">
                                ${isCardioCompleted ? 
                                    `<div class="flex justify-center items-center">
                                        <div class="data-card bg-orange-50">
                                            <span class="label text-gray-500">Kcal</span>
                                            <span class="value">${cardioInfo.calories}</span>
                                        </div>
                                        <div class="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                            ✓ Completado
                                        </div>
                                    </div>` : 
                                    `<span class="text-sm text-gray-400">Pendiente de registrar</span>`
                                }
                            </td>
                        </tr>`;
                    
                    // Si hay una rutina definida, mostrar todos los ejercicios de esa rutina
                    if (routineInfo.exercises && routineInfo.exercises.length > 0) {
                        routineInfo.exercises.forEach(exerciseName => {
                            const entry = registeredExercises[exerciseName];
                            const muscleGroup = exerciseMuscleGroups[exerciseName] || "";
                            const displayName = muscleGroup ? `${exerciseName} - ${muscleGroup}` : exerciseName;
                            
                            if (entry) {
                                // Ejercicio registrado
                                tableRows += `
                                    <tr class="border-b hover:bg-blue-50 transition-colors">
                                        <td class="py-2 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center" data-label="Ejercicio">
                                            <span class="font-medium">${displayName}</span>
                                            <button class="delete-btn-hist bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full p-1.5 transition-colors" data-id="${entry.id}" title="Eliminar registro">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                        <td class="py-2 px-3" data-label="Datos">
                                        <div class="flex justify-center items-center gap-2 flex-wrap data-cards-container">
                                            <div class="data-card bg-blue-50">
                                                <span class="label text-gray-500">Series</span>
                                                <span class="value">${entry.series}</span>
                                            </div>
                                            <div class="data-card bg-green-50">
                                                <span class="label text-gray-500">Reps</span>
                                                <span class="value">${entry.reps}</span>
                                            </div>
                                            <div class="data-card bg-purple-50">
                                                <span class="label text-gray-500">Peso</span>
                                                <span class="value">${entry.weight} kg</span>
                                            </div>
                                            <div class="data-card bg-orange-50">
                                                <span class="label text-gray-500">Kcal</span>
                                                <span class="value">${entry.calories}</span>
                                            </div>
                                        </div>
                                        </td>
                                    </tr>`;
                            } else {
                                // Ejercicio no registrado - mostrar como pendiente
                                tableRows += `
                                    <tr class="border-b bg-gray-50 text-gray-500">
                                        <td class="py-2 px-3 bg-gradient-to-r from-gray-50 to-gray-100 font-medium" data-label="Ejercicio">${displayName}</td>
                                        <td class="py-2 px-3 text-center" data-label="Datos">
                                            <span class="text-sm text-gray-400">Pendiente de registrar</span>
                                        </td>
                                    </tr>`;
                            }
                        });
                    } else {
                        // Si no hay una rutina definida, mostrar solo los ejercicios registrados
                        entries.workouts.forEach(entry => {
                            const muscleGroup = exerciseMuscleGroups[entry.exercise] || "";
                            const displayName = muscleGroup ? `${entry.exercise} - ${muscleGroup}` : entry.exercise;
                            
                            tableRows += `
                                <tr class="border-b hover:bg-blue-50 transition-colors">
                                    <td class="py-2 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center" data-label="Ejercicio">
                                        <span class="font-medium">${displayName}</span>
                                        <button class="delete-btn-hist bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full p-1.5 transition-colors" data-id="${entry.id}" title="Eliminar registro">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                    <td class="py-2 px-3" data-label="Datos">
                                        <div class="flex justify-center items-center gap-2 flex-wrap data-cards-container">
                                            <div class="data-card bg-blue-50">
                                                <span class="label text-gray-500">Series</span>
                                                <span class="value">${entry.series}</span>
                                            </div>
                                            <div class="data-card bg-green-50">
                                                <span class="label text-gray-500">Reps</span>
                                                <span class="value">${entry.reps}</span>
                                            </div>
                                            <div class="data-card bg-purple-50">
                                                <span class="label text-gray-500">Peso</span>
                                                <span class="value">${entry.weight} kg</span>
                                            </div>
                                            <div class="data-card bg-orange-50">
                                                <span class="label text-gray-500">Kcal</span>
                                                <span class="value">${entry.calories}</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>`;
                        });
                    }

                    const totalCalories = totalStrengthCalories + cardioCalories;
                    
                    // Usar nuestra función auxiliar para formatear la fecha de manera consistente
                    const formattedDate = formatLocalDate(date + 'T12:00:00.000Z');
                    
                    // Cálculo de completitud de la rutina
                    const totalExercises = routineInfo.exercises ? routineInfo.exercises.length + 1 : 1; // +1 para incluir el cardio
                    const completedExercises = Object.keys(registeredExercises).length;
                    // Verificar si se completó el cardio (si existe entrada de cardio)
                    const cardioCompleted = entries.cardio ? 1 : 0;
                    const totalCompletedExercises = completedExercises + cardioCompleted;
                    const completionPercentage = Math.round((totalCompletedExercises / totalExercises) * 100);
                    
                    const progressBarColor = completionPercentage < 50 ? 'bg-red-500' : 
                                           completionPercentage < 100 ? 'bg-yellow-500' : 'bg-green-500';

                    const historyCard = `
                        <div class="border rounded-lg overflow-hidden bg-white shadow-sm">
                            <div class="p-4 bg-gray-50 border-b">
                                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                    <div>
                                        <h3 class="font-bold text-base sm:text-lg text-gray-800">${formattedDate}</h3>
                                        <p class="text-sm text-gray-600">${routineInfo.name}</p>
                                    </div>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div class="h-2.5 rounded-full ${progressBarColor}" style="width: ${completionPercentage}%"></div>
                                </div>
                                <div class="flex justify-between items-center text-xs mt-1">
                                    <span class="${cardioCompleted ? 'cardio-indicator cardio-completed' : 'cardio-indicator cardio-pending'}">
                                        ${cardioCompleted ? '✓' : '○'} Cardio
                                    </span>
                                    <span class="text-right font-medium">
                                        ${totalCompletedExercises}/${totalExercises} ejercicios (${completedExercises} fuerza + ${cardioCompleted} cardio)
                                    </span>
                                </div>
                            </div>
                            <div class="p-3 sm:p-4">
                                <div class="overflow-x-auto -mx-3 sm:mx-0">
                                    <table class="min-w-full text-sm mb-4">
                                        <thead class="text-left bg-gray-50">
                                            <tr class="border-b">
                                                <th class="py-2 px-3 font-semibold" style="width: 50%">Ejercicio</th>
                                                <th class="py-2 px-3 font-semibold text-center">Datos</th>
                                            </tr>
                                        </thead>
                                        <tbody>${tableRows}</tbody>
                                    </table>
                                </div>
                                <div class="bg-blue-50 p-3 rounded-md">
                                    <h4 class="text-sm font-bold text-blue-800 mb-2">Resumen de Calorías Aproximadas</h4>
                                    <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                                        <div>
                                            <p class="text-sm text-gray-700 mb-1"><span class="font-medium mr-1">Fuerza:</span> <span class="font-bold">${totalStrengthCalories} Kcal</span></p>
                                            <p class="text-sm text-gray-700"><span class="font-medium mr-1">Cardio:</span> <span class="font-bold">${cardioCalories} Kcal</span></p>
                                        </div>
                                        <div class="mt-2 sm:mt-0 py-1 px-3 bg-blue-100 rounded-lg">
                                            <p class="text-md text-blue-800 font-bold">Total: <span class="text-lg">${totalCalories} Kcal</span></p>
                                            <p class="text-xs text-blue-600 text-center">(fuerza + cardio)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    historyContainer.innerHTML += historyCard;
                });
                addDeleteEventListenersHistory();
            }
            
            // Función auxiliar para obtener todas las entradas de un almacén
            function getAllEntries(storeName) {
                return new Promise((resolve, reject) => {
                    if (!db) {
                        resolve([]);
                        return;
                    }
                    
                    const transaction = db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();
                    
                    request.onsuccess = (e) => {
                        resolve(e.target.result || []);
                    };
                    
                    request.onerror = (e) => {
                        console.error(`Error al obtener entradas de ${storeName}:`, e.target.error);
                        resolve([]);
                    };
                });
            }
            
            function addDeleteEventListenersHistory() {
                document.querySelectorAll('.delete-btn-hist').forEach(button => {
                    button.addEventListener('click', (e) => {
                       e.stopPropagation(); // Evitar que el evento se propague
                       const entryId = parseInt(e.currentTarget.dataset.id, 10);
                       if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
                            deleteWorkoutEntry(entryId, displayHistory); // Pasar displayHistory como callback
                       }
                    });
                });
                
                document.querySelectorAll('.delete-cardio-btn-hist').forEach(button => {
                    button.addEventListener('click', (e) => {
                       e.stopPropagation(); // Evitar que el evento se propague
                       const entryId = parseInt(e.currentTarget.dataset.id, 10);
                       if (window.confirm('¿Estás seguro de que quieres eliminar este registro de cardio?')) {
                            deleteCardioEntry(entryId, displayHistory); // Pasar displayHistory como callback
                       }
                    });
                });
            }

            // --- NOTIFICACIÓN TOAST ---
            function showToast(message = '¡Ejercicio registrado!', isError = false) {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.style.backgroundColor = isError ? '#EF4444' : '#10B981';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }

            // --- INICIALIZACIÓN ---
            setupDB();
            
            // El event listener para cardioTimeSelect se configurará en updateCardioElements()
            // después de que los elementos sean inicializados
        });
