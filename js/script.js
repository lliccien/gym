document.addEventListener('DOMContentLoaded', () => {
             // --- FUNCIÓN PARA CONVERTIR NOMBRES A FORMATO DE ARCHIVO ---
            const toImageName = (name) => name.toLowerCase().replace(/ \/ /g, '-').replace(/ & /g, '-').replace(/ /g, '-');

            // --- ESTRUCTURA DE LA RUTINA ---
            const routine = {
                1: { name: "Piernas & Glúteos", cardio: "Caminadora inclinada (15 min)", exercises: ["Ultra Leg Press", "Ultra Leg Extension", "Ultra Glute", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                2: { name: "Pecho, Hombros & Tríceps", cardio: "Bicicleta (15 min)", exercises: ["Ultra Converging Chest Press", "Ultra Converging Shoulder Press", "Ultra Triceps Press", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                3: { name: "Espalda & Bíceps", cardio: "Elíptica (15 min)", exercises: ["Ultra Diverging Lat Pulldown", "Ultra Diverging Seated Row", "Ultra Independent Biceps Curl", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                4: { name: "Piernas (Variante)", cardio: "Caminadora o bicicleta (15 min)", exercises: ["Ultra Seated Leg Curl", "Ultra Hip Abductor", "Ultra Calf Extension", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                5: { name: "Full Body Ligero + Definición", cardio: "Elíptica o bicicleta (15 min)", exercises: ["Ultra Pec Fly / Rear Delt", "Ultra Converging Shoulder Press", "Ultra Glute", "Ultra Abdominal Crunch", "Ultra Back Extension"] },
                0: { name: "Día de Descanso", cardio: "Descanso activo o movilidad.", exercises: [] },
                6: { name: "Día de Descanso", cardio: "Descanso activo o movilidad.", exercises: [] }
            };

            let db;

            // --- ELEMENTOS DEL DOM ---
            const tabToday = document.getElementById('tab-today');
            const tabHistory = document.getElementById('tab-history');
            const viewToday = document.getElementById('view-today');
            const viewHistory = document.getElementById('view-history');
            const imageModal = document.getElementById('image-modal');
            const modalImage = document.getElementById('modal-image');
            const modalClose = document.getElementById('modal-close');


            // --- CONFIGURACIÓN DE INDEXEDDB ---
            function setupDB() {
                const request = indexedDB.open('gymTrackerDB', 2);
                request.onupgradeneeded = (e) => {
                    db = e.target.result;
                    if (!db.objectStoreNames.contains('workouts')) {
                        const store = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
                        store.createIndex('date', 'date', { unique: false });
                        // No es necesario modificar el índice para 'series' ya que no buscaremos por él directamente,
                        // pero si se quisiera, se podría añadir un índice aquí.
                        // store.createIndex('exercise', 'exercise', { unique: false }); // Ejemplo
                    }
                };
                request.onsuccess = (e) => {
                    db = e.target.result;
                    displayHistory();
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

            // --- MOSTRAR RUTINA DEL DÍA ---
            function displayDailyWorkout() {
                const container = document.getElementById('daily-workout-container');
                const todayIndex = new Date().getDay();
                const todayRoutine = routine[todayIndex];
                const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                
                let html = `<h2 class="text-xl md:text-2xl font-bold text-blue-600 mb-1">${dayNames[todayIndex]} - ${todayRoutine.name}</h2>`;
                html += `<p class="text-gray-500 mb-6"><strong>Cardio:</strong> ${todayRoutine.cardio}</p>`;

                if (todayRoutine.exercises.length > 0) {
                    html += '<div class="space-y-6">';
                    todayRoutine.exercises.forEach((exerciseName, index) => {
                        const imageName = toImageName(exerciseName);
                        html += `
                            <div class="p-3 border rounded-lg flex flex-col sm:flex-row items-center gap-4" id="exercise-card-${index}">
                                <!-- Columna de la Imagen -->
                                <div class="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28">
                                    <img src="images/gym/${imageName}.png" 
                                         alt="Imagen de ${exerciseName}" 
                                         class="w-full h-full object-cover rounded-md bg-gray-200 cursor-pointer exercise-image"
                                         onerror="this.onerror=null;this.src='https://placehold.co/128x128/e2e8f0/94a3b8?text=Sin+Imagen';">
                                </div>

                                <!-- Columna de Detalles y Controles -->
                                <div class="flex-grow w-full flex flex-col gap-3">
                                    <span class="font-semibold text-lg text-center sm:text-left">${exerciseName}</span>
                                    <div class="w-full flex flex-col md:flex-row items-center gap-3">
                                        <div class="w-full md:w-auto flex items-center gap-2">
                                            <input type="number" placeholder="3-4" class="series-input w-full md:w-20 p-2 border rounded-md text-center" data-exercise="${exerciseName}">
                                            <label class="text-sm font-medium">series</label>
                                        </div>
                                        <div class="w-full md:w-auto flex items-center gap-2">
                                            <input type="number" placeholder="12-15" class="reps-input w-full md:w-24 p-2 border rounded-md text-center" data-exercise="${exerciseName}">
                                            <label class="text-sm font-medium">reps</label>
                                        </div>
                                        <div class="w-full md:w-auto flex items-center gap-2">
                                            <input type="number" placeholder="--" class="weight-input w-full md:w-24 p-2 border rounded-md text-center" data-exercise="${exerciseName}" step="0.01">
                                            <label class="text-sm font-medium">kg</label>
                                        </div>
                                    </div>
                                    <button class="register-btn w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300" data-exercise="${exerciseName}" data-card-id="exercise-card-${index}">
                                        Registrar
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                } else {
                     html += '<p class="text-center text-lg text-green-600 font-semibold py-8">¡Aprovecha tu día de descanso!</p>';
                }
                container.innerHTML = html;
                addRegisterEventListeners();
                addImageModalListeners(); // Añadir listeners para el modal
            }
            
            // --- MANEJO DE EVENTOS DEL MODAL DE IMAGEN ---
            function addImageModalListeners() {
                document.querySelectorAll('.exercise-image').forEach(img => {
                    img.addEventListener('click', (e) => {
                        // No abrir modal para la imagen de respaldo
                        if (e.target.src.includes('placehold.co')) return;
                        
                        modalImage.src = e.target.src;
                        imageModal.classList.remove('hidden');
                    });
                });
            }

            function closeModal() {
                imageModal.classList.add('hidden');
                modalImage.src = ""; // Limpiar src para evitar flashes de la imagen anterior
            }
            
            modalClose.addEventListener('click', closeModal);
            imageModal.addEventListener('click', (e) => {
                 // Cerrar si se hace clic en el fondo oscuro
                if (e.target === imageModal) {
                    closeModal();
                }
            });


            // --- MANEJO DE EVENTOS DE REGISTRO ---
            function addRegisterEventListeners() {
                document.querySelectorAll('.register-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const exerciseName = e.target.dataset.exercise;
                        const seriesInput = document.querySelector(`.series-input[data-exercise="${exerciseName}"]`);
                        const repsInput = document.querySelector(`.reps-input[data-exercise="${exerciseName}"]`);
                        const weightInput = document.querySelector(`.weight-input[data-exercise="${exerciseName}"]`);

                        if (!seriesInput.value || !repsInput.value || !weightInput.value) {
                            showToast('Por favor, ingresa series, repeticiones y peso.', true);
                            return;
                        }

                        addWorkoutEntry({
                            date: new Date().toISOString(),
                            exercise: exerciseName,
                            series: seriesInput.value,
                            reps: repsInput.value,
                            weight: parseFloat(weightInput.value)
                        });
                        
                        document.getElementById(e.target.dataset.cardId).classList.add('bg-green-50');
                        e.target.textContent = '✓ Registrado';
                        e.target.disabled = true;
                        e.target.classList.replace('bg-blue-500', 'bg-green-600');
                    });
                });
            }

            // --- OPERACIONES DE INDEXEDDB ---
            function addWorkoutEntry(entry) {
                if (!db) return;
                const transaction = db.transaction(['workouts'], 'readwrite');
                const request = transaction.objectStore('workouts').add(entry);
                request.onsuccess = () => showToast();
                request.onerror = (e) => console.error('Error al guardar:', e.target.error);
            }
            
            function deleteWorkoutEntry(id) {
                if (!db) return;
                const transaction = db.transaction(['workouts'], 'readwrite');
                const request = transaction.objectStore('workouts').delete(id);
                request.onsuccess = () => {
                    showToast("Registro eliminado.");
                    displayHistory();
                }
                request.onerror = (e) => console.error('Error al eliminar:', e.target.error);
            }

            // --- MOSTRAR HISTORIAL ---
            function displayHistory() {
                if (!db) return;
                const tbody = document.getElementById('history-tbody');
                tbody.innerHTML = ''; // Limpiar antes de añadir nuevas filas
                const store = db.transaction('workouts').objectStore('workouts');
                const request = store.index('date').openCursor(null, 'prev');

                let entriesFound = false;
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        entriesFound = true;
                        const entry = cursor.value;
                        const date = new Date(entry.date);
                        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                        
                        const row = document.createElement('tr');
                        row.className = "bg-white border-b hover:bg-gray-50";
                        // Asegurarse de que los data-label coincidan con los nuevos th si se modifican
                        row.innerHTML = `
                            <td data-label="Fecha">${formattedDate}</td>
                            <td data-label="Ejercicio" class="font-medium text-gray-900">${entry.exercise}</td>
                            <td data-label="Series">${entry.series || 'N/A'}</td>
                            <td data-label="Repeticiones">${entry.reps}</td>
                            <td data-label="Peso (kg)">${entry.weight}</td>
                            <td data-label="Acción" class="text-center">
                                <button class="delete-btn text-red-500 hover:text-red-700 font-semibold" data-id="${entry.id}">
                                    Eliminar
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                        cursor.continue();
                    } else {
                         if (!entriesFound) {
                            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Aún no hay registros. ¡Completa un ejercicio para empezar!</td></tr>';
                         }
                         addDeleteEventListeners();
                    }
                };
            }
            
            function addDeleteEventListeners() {
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                       const entryId = parseInt(e.target.dataset.id, 10);
                       if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
                            deleteWorkoutEntry(entryId);
                       }
                    });
                });
            }

            // --- NOTIFICACIÓN TOAST ---
            function showToast(message = '¡Ejercicio registrado con éxito!', isError = false) {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.style.backgroundColor = isError ? '#EF4444' : '#10B981'; // red-500 or green-500
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }

            // --- INICIALIZACIÓN ---
            setupDB();
            displayDailyWorkout();
        });
