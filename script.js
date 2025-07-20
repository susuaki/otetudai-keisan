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
    const totalPointsSpan = document.getElementById('total-points');
    const ratePointsInput = document.getElementById('rate-points');
    const rateYenInput = document.getElementById('rate-yen');
    const totalYenSpan = document.getElementById('total-yen');

    const modal = document.getElementById('day-modal');
    const modalDate = document.getElementById('modal-date');
    const modalChoreList = document.getElementById('modal-chore-list');
    const saveDayBtn = document.getElementById('save-day-btn');
    const closeBtn = document.querySelector('.close-btn');

    // App State
    let chores = JSON.parse(localStorage.getItem('chores')) || [];
    let dailyRecords = JSON.parse(localStorage.getItem('dailyRecords')) || {};
    let currentDate = new Date();
    let selectedDate = null;

    // --- Local Storage --- 
    const saveChores = () => {
        localStorage.setItem('chores', JSON.stringify(chores));
    };
    const saveDailyRecords = () => {
        localStorage.setItem('dailyRecords', JSON.stringify(dailyRecords));
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
        modalDate.textContent = date;
        modalChoreList.innerHTML = '';

        const previouslyChecked = dailyRecords[date] || [];

        if (chores.length === 0) {
            modalChoreList.innerHTML = '<p>まずはお手伝いを設定してください。</p>';
        } else {
            chores.forEach(chore => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `chore-${chore.name}`;
                checkbox.value = chore.name;
                checkbox.checked = previouslyChecked.includes(chore.name);

                const label = document.createElement('label');
                label.htmlFor = `chore-${chore.name}`;
                label.textContent = `${chore.name} (${chore.points} pt)`;

                const div = document.createElement('div');
                div.className = 'chore-checkbox-list';
                div.appendChild(checkbox);
                div.appendChild(label);
                modalChoreList.appendChild(div);
            });
        }

        modal.style.display = 'block';
    };

    const closeDayModal = () => {
        modal.style.display = 'none';
        selectedDate = null;
    }

    closeBtn.addEventListener('click', closeDayModal);
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            closeDayModal();
        }
    });

    saveDayBtn.addEventListener('click', () => {
        const selectedChores = [];
        modalChoreList.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            selectedChores.push(checkbox.value);
        });

        if (selectedChores.length > 0) {
            dailyRecords[selectedDate] = selectedChores;
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
        const month = currentDate.getMonth() + 1;
        let totalPoints = 0;

        for (const date in dailyRecords) {
            if (date.startsWith(`${year}-${month}`)) {
                totalPoints += dailyRecords[date].reduce((sum, choreName) => {
                    const chore = chores.find(c => c.name === choreName);
                    return sum + (chore ? chore.points : 0);
                }, 0);
            }
        }

        totalPointsSpan.textContent = totalPoints;
        const ratePoints = parseFloat(ratePointsInput.value) || 1;
        const rateYen = parseFloat(rateYenInput.value) || 0;
        if (ratePoints > 0) {
            totalYenSpan.textContent = Math.floor((totalPoints / ratePoints) * rateYen);
        } else {
            totalYenSpan.textContent = 0;
        }
    };

    ratePointsInput.addEventListener('input', updateSummary);
    rateYenInput.addEventListener('input', updateSummary);

    // --- Initial Load ---
    renderChores();
    renderCalendar();
    updateSummary();
});
