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

            function calculateCardioCalories(cardioString) {
                const durationMatch = cardioString.match(/\((\d+)\s*min\)/);
                if (!durationMatch) return 0;
                const durationInMinutes = parseInt(durationMatch[1], 10);
                const met = 8; // Valor MET promedio para cardio moderado
                const bodyWeightKg = 70; // Un peso corporal promedio como referencia
                return Math.round(met * 3.5 * bodyWeightKg / 200 * durationInMinutes);
            }

            // --- ESTRUCTURA DE LA RUTINA ---
            const routine = {
                1: { name: "Piernas & Glúteos", cardio: "Caminadora inclinada (15 min)", exercises: ["Ultra Leg Press", "Ultra Leg Extension", "Ultra Glute", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                2: { name: "Pecho, Hombros & Tríceps", cardio: "Bicicleta (15 min)", exercises: ["Ultra Converging Chest Press", "Ultra Converging Shoulder Press", "Ultra Triceps Press", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                3: { name: "Espalda & Bíceps", cardio: "Elíptica (15 min)", exercises: ["Ultra Diverging Lat Pulldown", "Ultra Diverging Seated Row", "Ultra Independent Biceps Curl", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                4: { name: "Piernas (Variante)", cardio: "Caminadora o bicicleta (15 min)", exercises: ["Ultra Seated Leg Curl", "Ultra Hip Abductor", "Ultra Calf Extension", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                5: { name: "Full Body Ligero + Definición", cardio: "Elíptica o bicicleta (20 min)", exercises: ["Ultra Pec Fly Rear Delt", "Ultra Converging Shoulder Press", "Ultra Glute", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                0: { name: "Día de Descanso", cardio: "Descanso activo o movilidad.", exercises: [] },
                6: { name: "Día de Descanso", cardio: "Descanso activo o movilidad.", exercises: [] }
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

            // --- CONFIGURACIÓN DE INDEXEDDB ---
            function setupDB() {
                const request = indexedDB.open('gymTrackerDB', 3); // <--- VERSIÓN 3
                request.onupgradeneeded = (e) => {
                    db = e.target.result;
                    const store = e.target.transaction.objectStore('workouts');
                    if (!store.indexNames.contains('routineId')) {
                        store.createIndex('routineId', 'routineId', { unique: false });
                    }
                };
                request.onsuccess = (e) => {
                    db = e.target.result;
                    populateRoutineSelector();
                    const todayIndex = new Date().getDay();
                    routineSelect.value = todayIndex;
                    displayWorkout(todayIndex);
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
                
                const cardioCalories = calculateCardioCalories(selectedRoutine.cardio);
                let html = `<h3 class="text-xl md:text-2xl font-bold text-gray-800 mb-1">${dayName} - ${selectedRoutine.name}</h3>`;
                html += `<p class="text-gray-500 mb-1"><strong>Cardio:</strong> ${selectedRoutine.cardio}</p>`;
                if (cardioCalories > 0) {
                    html += `<p class="text-sm font-semibold text-orange-500 mb-6">🔥 ${cardioCalories} Kcal (aprox.)</p>`;
                }

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
                            date: new Date().toISOString(),
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

                        const calorieDisplay = document.createElement('div');
                        calorieDisplay.className = 'text-center md:text-left text-sm font-semibold text-orange-500 mt-2';
                        calorieDisplay.textContent = `🔥 ${calories} Kcal (aprox.)`;
                        e.target.insertAdjacentElement('afterend', calorieDisplay);
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

                const transaction = db.transaction(['workouts'], 'readonly');
                const store = transaction.objectStore('workouts');
                const request = store.getAll();

                request.onerror = (e) => {
                    historyContainer.innerHTML = '<p class="text-red-500">Error al cargar el historial.</p>';
                };

                request.onsuccess = (e) => {
                    const allEntries = e.target.result;
                    if (!allEntries || allEntries.length === 0) {
                        historyContainer.innerHTML = '<p class="text-center py-8 text-gray-500">Aún no hay registros.</p>';
                        return;
                    }

                    // Agrupar por fecha (YYYY-MM-DD)
                    const groupedByDate = allEntries.reduce((acc, entry) => {
                        const date = entry.date.split('T')[0];
                        if (!acc[date]) {
                            acc[date] = [];
                        }
                        acc[date].push(entry);
                        return acc;
                    }, {});

                    // Ordenar fechas de más reciente a más antigua
                    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

                    sortedDates.forEach(date => {
                        const entries = groupedByDate[date];
                        const routineId = entries[0].routineId; // Asumimos la misma rutina para todas las entradas del día
                        const routineInfo = routine[routineId] || { name: 'Desconocida', cardio: '', exercises: [] };
                        const cardioCalories = calculateCardioCalories(routineInfo.cardio);
                        let totalStrengthCalories = 0;
                        
                        // Crear un mapa de los ejercicios registrados para fácil acceso
                        const registeredExercises = {};
                        entries.forEach(entry => {
                            registeredExercises[entry.exercise] = entry;
                            totalStrengthCalories += entry.calories || 0;
                        });
                        
                        // Crear filas de tabla para todos los ejercicios de la rutina
                        let tableRows = '';
                        
                        // Añadir fila de cardio primero
                        if (routineInfo.cardio) {
                            const isCardioCompleted = cardioCalories > 0;
                            tableRows += `
                                <tr class="border-b ${isCardioCompleted ? 'hover:bg-blue-50' : 'bg-gray-50 text-gray-500'} transition-colors">
                                    <td class="py-2 px-3 bg-gradient-to-r ${isCardioCompleted ? 'from-green-50 to-teal-50' : 'from-gray-50 to-gray-100'} font-medium" data-label="Ejercicio">
                                        <span class="font-medium">Cardio - ${routineInfo.cardio}</span>
                                    </td>
                                    <td class="py-2 px-3" data-label="Datos">
                                        ${isCardioCompleted ? 
                                            `<div class="flex justify-center items-center">
                                                <div class="data-card bg-orange-50">
                                                    <span class="label text-gray-500">Kcal</span>
                                                    <span class="value">${cardioCalories}</span>
                                                </div>
                                                <div class="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                    ✓ Completado
                                                </div>
                                            </div>` : 
                                            `<span class="text-sm text-gray-400">Pendiente de registrar</span>`
                                        }
                                    </td>
                                </tr>`;
                        }
                        
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
                            entries.forEach(entry => {
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
                        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        
                        // Cálculo de completitud de la rutina
                        const totalExercises = routineInfo.exercises ? routineInfo.exercises.length + 1 : 1; // +1 para incluir el cardio
                        const completedExercises = Object.keys(registeredExercises).length;
                        // Verificar si se completó el cardio (si tiene calorías, se considera completado)
                        const cardioCompleted = cardioCalories > 0 ? 1 : 0;
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
                };
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
        });
