document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const choreNameInput = document.getElementById('chore-name');
    const chorePointsInput = document.getElementById('chore-points');
    const addChoreBtn = document.getElementById('add-chore-btn');
    const choreList = document.getElementById('chore-list');
    const monthAndYear = document.getElementById('month-and-year');
    const calendarDiv = document.getElementById('calendar');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const carriedOverPointsSpan = document.getElementById('carried-over-points');
    const monthlyPointsSpan = document.getElementById('monthly-points');
    const totalPointsSpan = document.getElementById('total-points');
    const ratePointsInput = document.getElementById('rate-points');
    const rateYenInput = document.getElementById('rate-yen');
    const totalYenSpan = document.getElementById('total-yen');

    const modal = document.getElementById('day-modal');
    const modalDate = document.getElementById('modal-date');
    const modalChoreSelect = document.getElementById('modal-chore-select');
    const addDayChoreBtn = document.getElementById('add-day-chore-btn');
    const dayChoreList = document.getElementById('day-chore-list');
    const saveDayBtn = document.getElementById('save-day-btn');
    const closeBtn = document.querySelector('.close-btn');

    // App State
    let chores = JSON.parse(localStorage.getItem('chores')) || [];
    let dailyRecords = JSON.parse(localStorage.getItem('dailyRecords')) || {};
    let carriedOverPointsData = JSON.parse(localStorage.getItem('carriedOverPointsData')) || {};
    let currentDate = new Date();
    let selectedDate = null;
    let tempDayChores = []; // To hold chores for the day being edited in the modal

    // --- Local Storage --- 
    const saveChores = () => {
        localStorage.setItem('chores', JSON.stringify(chores));
    };
    const saveDailyRecords = () => {
        localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
    };
    const saveCarriedOverPoints = () => {
        localStorage.setItem('carriedOverPointsData', JSON.stringify(carriedOverPointsData));
    };

    const renderChores = () => {
        choreList.innerHTML = '';
        chores.forEach((chore, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${chore.name} (${chore.points} pt)</span>
                <button class="delete-chore-btn" data-index="${index}">削除</button>
            `;
            choreList.appendChild(li);
        });
    };

    addChoreBtn.addEventListener('click', () => {
        const name = choreNameInput.value.trim();
        const points = parseInt(chorePointsInput.value);
        if (name && !isNaN(points) && points > 0) {
            chores.push({ name, points });
            saveChores();
            renderChores();
            choreNameInput.value = '';
            chorePointsInput.value = '';
        }
    });

    choreList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-chore-btn')) {
            const index = e.target.dataset.index;
            chores.splice(index, 1);
            saveChores();
            renderChores();
            // Also remove this chore from all daily records
            Object.keys(dailyRecords).forEach(date => {
                dailyRecords[date] = dailyRecords[date].filter(choreName => choreName !== e.target.previousElementSibling.textContent.split(' (')[0]);
            });
            saveDailyRecords();
            renderCalendar(); // Re-render calendar to update points
            updateSummary(); 
        }
    });

    // --- Calendar --- 
    const renderCalendar = () => {
        calendarDiv.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthAndYear.textContent = `${year}年 ${month + 1}月`;

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        // Day headers
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarDiv.appendChild(dayHeader);
        });

        for (let i = 0; i < firstDay; i++) {
            calendarDiv.appendChild(document.createElement('div'));
        }

        for (let date = 1; date <= lastDate; date++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.dataset.date = `${year}-${month + 1}-${date}`;
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date;
            dayCell.appendChild(dayNumber);

            const choresForDay = document.createElement('div');
            choresForDay.className = 'chores-for-day';
            dayCell.appendChild(choresForDay);

            dayCell.addEventListener('click', () => openDayModal(dayCell.dataset.date));
            calendarDiv.appendChild(dayCell);
        }
        updateCalendarHighlights();
    };

    const updateCalendarHighlights = () => {
        document.querySelectorAll('.calendar-day[data-date]').forEach(dayCell => {
            const date = dayCell.dataset.date;
            const choresForDayDiv = dayCell.querySelector('.chores-for-day');
            if (date && dailyRecords[date] && dailyRecords[date].length > 0) {
                const points = dailyRecords[date].reduce((sum, choreName) => {
                    const chore = chores.find(c => c.name === choreName);
                    return sum + (chore ? chore.points : 0);
                }, 0);
                choresForDayDiv.textContent = `${points} pt`;
            } else {
                choresForDayDiv.textContent = ''; // Clear points if no chores
            }
        });
    };

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        updateSummary();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        updateSummary();
    });

    // --- Modal --- 
    const openDayModal = (date) => {
        selectedDate = date;
        tempDayChores = [...(dailyRecords[date] || [])]; // Copy existing chores to a temporary array
        modalDate.textContent = date;

        // Populate dropdown
        modalChoreSelect.innerHTML = '';
        if (chores.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'お手伝いを設定してください';
            option.disabled = true;
            modalChoreSelect.appendChild(option);
            addDayChoreBtn.disabled = true;
        } else {
            chores.forEach(chore => {
                const option = document.createElement('option');
                option.value = chore.name;
                option.textContent = `${chore.name} (${chore.points} pt)`;
                modalChoreSelect.appendChild(option);
            });
            addDayChoreBtn.disabled = false;
        }

        renderTempDayChores();
        modal.style.display = 'block';
    };

    const renderTempDayChores = () => {
        dayChoreList.innerHTML = '';
        tempDayChores.forEach((choreName, index) => {
            const chore = chores.find(c => c.name === choreName);
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${choreName} (${chore ? chore.points : 0} pt)</span>
                <button class="delete-day-chore-btn" data-index="${index}">削除</button>
            `;
            dayChoreList.appendChild(li);
        });
    };

    addDayChoreBtn.addEventListener('click', () => {
        const selectedChoreName = modalChoreSelect.value;
        if (selectedChoreName) {
            tempDayChores.push(selectedChoreName);
            renderTempDayChores();
        }
    });

    dayChoreList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-day-chore-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            tempDayChores.splice(index, 1);
            renderTempDayChores();
        }
    });

    const closeDayModal = () => {
        modal.style.display = 'none';
        selectedDate = null;
        tempDayChores = [];
    }

    closeBtn.addEventListener('click', closeDayModal);
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            closeDayModal();
        }
    });

    saveDayBtn.addEventListener('click', () => {
        if (tempDayChores.length > 0) {
            dailyRecords[selectedDate] = [...tempDayChores];
        } else {
            delete dailyRecords[selectedDate]; // Remove date entry if no chores are selected
        }
        
        saveDailyRecords();
        renderCalendar();
        updateSummary();
        closeDayModal();
    });

    // --- Summary Calculation ---
    const updateSummary = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed

        // Key for the CURRENT month (e.g., '2024-7')
        const currentMonthKey = `${year}-${month + 1}`;
        // Key for the PREVIOUS month
        const prevMonthDate = new Date(year, month - 1);
        const prevMonthKey = `${prevMonthDate.getFullYear()}-${prevMonthDate.getMonth() + 1}`;

        // 1. Get carried-over points from the PREVIOUS month
        const prevMonthCarryOver = carriedOverPointsData[prevMonthKey] || 0;

        // 2. Calculate points earned this month
        let monthlyPoints = 0;
        for (const date in dailyRecords) {
            const recordDate = new Date(date.split('-').join('/')); // More robust date parsing
            if (recordDate.getFullYear() === year && recordDate.getMonth() === month) {
                monthlyPoints += dailyRecords[date].reduce((sum, choreName) => {
                    const chore = chores.find(c => c.name === choreName);
                    return sum + (chore ? chore.points : 0);
                }, 0);
            }
        }

        // 3. Calculate total points for conversion
        const totalPointsForConversion = prevMonthCarryOver + monthlyPoints;

        // 4. Calculate Yen and the new carry-over points for NEXT month
        const ratePoints = parseFloat(ratePointsInput.value) || 1;
        const rateYen = parseFloat(rateYenInput.value) || 0;
        let totalYen = 0;
        let newCarryOver = totalPointsForConversion; // Default to all points if rate is invalid

        if (ratePoints > 0 && rateYen > 0) {
            // Calculate potential yen without any rounding to 10s
            const potentialYen = Math.floor((totalPointsForConversion / ratePoints) * rateYen);
            
            // Round the yen amount down to the nearest 10
            totalYen = Math.floor(potentialYen / 10) * 10;

            // Calculate how many points were actually used for the final yen amount
            const pointsUsed = Math.floor((totalYen / rateYen) * ratePoints);
            
            // The new carry-over is the remainder
            newCarryOver = totalPointsForConversion - pointsUsed;
        } else {
            // If rate is not valid for conversion, no yen is given and all points are carried over.
            totalYen = 0;
            newCarryOver = totalPointsForConversion;
        }

        // 5. Save the new carry-over for the CURRENT month
        carriedOverPointsData[currentMonthKey] = newCarryOver;
        saveCarriedOverPoints();

        // 6. Update UI
        carriedOverPointsSpan.textContent = prevMonthCarryOver;
        monthlyPointsSpan.textContent = monthlyPoints;
        totalPointsSpan.textContent = totalPointsForConversion;
        totalYenSpan.textContent = totalYen;
    };

    ratePointsInput.addEventListener('input', updateSummary);
    rateYenInput.addEventListener('input', updateSummary);

    // --- Initial Load ---
    renderChores();
    renderCalendar();
    updateSummary();
});
