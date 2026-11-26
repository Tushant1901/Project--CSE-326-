// ==========================================
// SAFEHAVEN
// EMERGENCY SHELTER ALLOCATION SYSTEM
// ==========================================


// DATABASE

let shelters = JSON.parse(
    localStorage.getItem("safehaven_shelters")
) || [];

let registrations = JSON.parse(
    localStorage.getItem("safehaven_registrations")
) || [];


// INITIAL SHELTERS

if (shelters.length === 0) {

    shelters = [

        {
            id: 1,
            name: "Ganga Shelter",
            location: "New Delhi",
            category: "human",
            rooms: 10,
            bedsPerRoom: 50
        },

        {
            id: 2,
            name: "Yamuna Shelter",
            location: "Uttar Pradesh",
            category: "human",
            rooms: 8,
            bedsPerRoom: 50
        },

        {
            id: 3,
            name: "Brahmaputra Shelter",
            location: "Assam",
            category: "human",
            rooms: 6,
            bedsPerRoom: 50
        },

        {
            id: 4,
            name: "Godavari Animal Shelter",
            location: "Maharashtra",
            category: "animal",
            rooms: 5,
            bedsPerRoom: 50
        }

    ];

    saveData();

}


// SAVE DATA

function saveData() {

    localStorage.setItem(
        "safehaven_shelters",
        JSON.stringify(shelters)
    );

    localStorage.setItem(
        "safehaven_registrations",
        JSON.stringify(registrations)
    );

}


// UNIQUE ID

function generateID() {

    return "SH" + Date.now() + Math.floor(Math.random() * 100);

}


// ==========================================
// REGISTRATION TABS
// ==========================================

function showForm(type, button) {

    document.querySelectorAll(".registration-form")
        .forEach(form => form.classList.add("hidden"));

    document.getElementById(type + "Form")
        .classList.remove("hidden");

    document.querySelectorAll(".tab")
        .forEach(tab => tab.classList.remove("active"));

    button.classList.add("active");

}


// ==========================================
// FAMILY MEMBER GENERATION
// ==========================================

function generateFamilyFields() {

    const count = Number(
        document.getElementById("familyCount").value
    );

    const container = document.getElementById("familyMembers");

    container.innerHTML = "";

    for (let i = 1; i <= count; i++) {

        container.innerHTML += `

            <div class="member-card">

                <h4>Family Member ${i}</h4>

                <input
                    type="text"
                    class="member-name"
                    placeholder="Full Name"
                    required
                >

                <input
                    type="number"
                    class="member-age"
                    placeholder="Age"
                    min="0"
                    max="120"
                    required
                >

            </div>

        `;

    }

}


// ==========================================
// FIND AVAILABLE BEDS
// ==========================================

function getOccupiedBeds(shelterId, roomNo) {

    let occupied = [];

    registrations.forEach(person => {

        if (
            person.shelterId === shelterId &&
            person.status === "Reserved"
        ) {

            person.beds.forEach(bed => {

                if (bed.room === roomNo) {

                    occupied.push(bed.bed);

                }

            });

        }

    });

    return occupied;

}


// FIND ROOM FOR FAMILY
// SAME ROOM FIRST
// ==========================================

function allocateBeds(shelter, quantity) {

    if (!shelter) return null;

    let roomCapacity = shelter.bedsPerRoom;

    let available = shelter.rooms * roomCapacity;

    let totalOccupied = registrations
        .filter(p =>
            p.shelterId === shelter.id &&
            p.status === "Reserved"
        )
        .reduce((sum, p) => sum + p.beds.length, 0);

    if (available - totalOccupied < quantity) {

        return null;

    }


    let beds = [];

    // FIRST TRY TO FIT FAMILY IN SAME ROOM

    for (let room = 1; room <= shelter.rooms; room++) {

        let occupied = getOccupiedBeds(shelter.id, room);

        let free = [];

        for (let bed = 1; bed <= roomCapacity; bed++) {

            if (!occupied.includes(bed)) {

                free.push(bed);

            }

        }

        if (free.length >= quantity) {

            for (let i = 0; i < quantity; i++) {

                beds.push({

                    room: room,
                    bed: free[i]

                });

            }

            return beds;

        }

    }


    // IF SAME ROOM NOT POSSIBLE, USE MULTIPLE ROOMS

    for (let room = 1; room <= shelter.rooms; room++) {

        let occupied = getOccupiedBeds(shelter.id, room);

        for (let bed = 1; bed <= roomCapacity; bed++) {

            if (!occupied.includes(bed)) {

                beds.push({

                    room: room,
                    bed: bed

                });

                if (beds.length === quantity) {

                    return beds;

                }

            }

        }

    }

    return null;

}


// ==========================================
// FIND SUITABLE SHELTER
// ==========================================

function findShelter(category, quantity) {

    let suitable = shelters.filter(shelter =>
        shelter.category === category
    );

    for (let shelter of suitable) {

        let beds = allocateBeds(shelter, quantity);

        if (beds) {

            return {

                shelter: shelter,
                beds: beds

            };

        }

    }

    return null;

}


// ==========================================
// CREATE REGISTRATION
// ==========================================

function createRegistration(data) {

    let allocation = findShelter(
        data.category,
        data.members.length
    );

    if (!allocation) {

        alert(
            "Sorry! No suitable shelter has enough available capacity."
        );

        return false;

    }


    let registration = {

        id: generateID(),

        name: data.name,

        phone: data.phone,

        category: data.category,

        members: data.members,

        shelterId: allocation.shelter.id,

        shelterName: allocation.shelter.name,

        location: allocation.shelter.location,

        beds: allocation.beds,

        status: "Reserved",

        createdAt: Date.now(),

        expiresAt: Date.now() + (5 * 60 * 60 * 1000)

    };


    registrations.push(registration);

    saveData();

    updateDashboard();

    renderShelters();

    renderRecords();

    showAllocation(registration);

    showToast("Registration successful! Shelter allocated.");

    return true;

}


// ==========================================
// INDIVIDUAL REGISTRATION
// ==========================================

document.getElementById("individualForm")
    .addEventListener("submit", function(e) {

        e.preventDefault();

        const data = {

            name: document.getElementById("personName").value.trim(),

            phone: document.getElementById("personPhone").value.trim(),

            category: "human",

            members: [

                {

                    name: document.getElementById("personName").value.trim(),

                    age: document.getElementById("personAge").value

                }

            ]

        };


        if (createRegistration(data)) {

            this.reset();

        }

    });


// ==========================================
// FAMILY REGISTRATION
// ==========================================

document.getElementById("familyForm")
    .addEventListener("submit", function(e) {

        e.preventDefault();

        let names = document.querySelectorAll(".member-name");

        let ages = document.querySelectorAll(".member-age");

        let members = [];

        for (let i = 0; i < names.length; i++) {

            members.push({

                name: names[i].value.trim(),

                age: ages[i].value

            });

        }


        const data = {

            name: document.getElementById("familyHead").value.trim(),

            phone: document.getElementById("familyPhone").value.trim(),

            category: "human",

            members: members

        };


        if (createRegistration(data)) {

            this.reset();

            document.getElementById("familyMembers").innerHTML = "";

        }

    });


// ==========================================
// ANIMAL REGISTRATION
// ==========================================

document.getElementById("animalForm")
    .addEventListener("submit", function(e) {

        e.preventDefault();

        const quantity = Number(
            document.getElementById("animalQuantity").value
        );

        const animalType =
            document.getElementById("animalType").value;

        let members = [];

        for (let i = 1; i <= quantity; i++) {

            members.push({

                name: animalType + " " + i,

                age: "Not specified"

            });

        }


        const data = {

            name: document.getElementById("animalOwner").value.trim(),

            phone: document.getElementById("animalPhone").value.trim(),

            category: "animal",

            members: members

        };


        if (createRegistration(data)) {

            this.reset();

        }

    });


// ==========================================
// ALLOCATION DISPLAY
// ==========================================

function showAllocation(person) {

    const result = document.getElementById("allocationResult");

    let bedDetails = person.beds.map(bed => `

        <div class="result-item">

            <small>ROOM ${bed.room}</small>

            <h3>Bed ${String(bed.bed).padStart(2, "0")}</h3>

        </div>

    `).join("");


    result.className = "result-card";

    result.innerHTML = `

        <h3>✓ Allocation Successful</h3>

        <p><strong>Registration ID:</strong> ${person.id}</p>

        <p><strong>Name / Owner:</strong> ${escapeHTML(person.name)}</p>

        <p><strong>Category:</strong> ${person.category}</p>

        <p><strong>Shelter:</strong> ${escapeHTML(person.shelterName)}</p>

        <p><strong>Location:</strong> ${escapeHTML(person.location)}</p>

        <br>

        <h4>Allocated Room & Bed Details</h4>

        <div class="result-grid">

            ${bedDetails}

        </div>

        <div class="timer" id="allocationTimer">

            05:00:00

        </div>

        <p>Time remaining to reach the shelter.</p>

        <button class="location-disabled" disabled>

            📍 View Location (Currently Disabled)

        </button>

    `;

    updateSingleTimer(person);

    result.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    let total = 0;

    let occupied = 0;

    shelters.forEach(shelter => {

        if (shelter.category === "human") {

            total += shelter.rooms * shelter.bedsPerRoom;

            registrations.forEach(person => {

                if (
                    person.shelterId === shelter.id &&
                    person.status === "Reserved"
                ) {

                    occupied += person.beds.length;

                }

            });

        }

    });


    document.getElementById("totalShelters").innerText =
        shelters.length;

    document.getElementById("availableBeds").innerText =
        total - occupied;

    document.getElementById("occupiedBeds").innerText =
        occupied;

    document.getElementById("totalRegistrations").innerText =
        registrations.length;

}


// ==========================================
// SHELTER DISPLAY
// ==========================================

function renderShelters() {

    const container = document.getElementById("shelterList");

    const search = document.getElementById("shelterSearch")
        .value.toLowerCase();

    container.innerHTML = "";


    shelters.forEach(shelter => {

        if (!shelter.name.toLowerCase().includes(search)) {

            return;

        }


        let capacity = shelter.rooms * shelter.bedsPerRoom;

        let occupied = registrations
            .filter(person =>
                person.shelterId === shelter.id &&
                person.status === "Reserved"
            )
            .reduce((sum, person) => sum + person.beds.length, 0);


        let available = capacity - occupied;

        let percentage = capacity > 0
            ? (occupied / capacity) * 100
            : 0;


        let status = available === 0
            ? "Full"
            : percentage >= 80
                ? "Limited"
                : "Available";


        let statusClass = status.toLowerCase();


        container.innerHTML += `

            <div class="shelter-card">

                <div class="river-icon">
                    ${shelter.category === "animal" ? "🐾" : "🌊"}
                </div>

                <h3>${escapeHTML(shelter.name)}</h3>

                <p>📍 ${escapeHTML(shelter.location)}</p>

                <p>
                    Category:
                    ${shelter.category === "animal" ? "Animal" : "Human"}
                </p>

                <p>Total Rooms: ${shelter.rooms}</p>

                <p>Total Capacity: ${capacity}</p>

                <p>Occupied: ${occupied}</p>

                <p>Available: ${available}</p>

                <div class="capacity-bar">

                    <div class="capacity-fill"
                        style="width:${percentage}%">
                    </div>

                </div>

                <span class="status ${statusClass}">
                    ${status}
                </span>

                <button class="location-btn" disabled>
                    📍 Location Unavailable
                </button>

            </div>

        `;

    });

}


// ==========================================
// ALLOCATION RECORDS
// ==========================================

function renderRecords() {

    const table = document.getElementById("recordsTable");

    table.innerHTML = "";


    registrations.slice().reverse().forEach(person => {

        const bedText = person.beds.map(b =>
            `R${b.room}/B${b.bed}`
        ).join(", ");


        let timerText = person.status === "Reserved"
            ? getRemainingTime(person.expiresAt)
            : person.status;


        table.innerHTML += `

            <tr>

                <td>${person.id}</td>

                <td>${escapeHTML(person.name)}</td>

                <td>${person.category}</td>

                <td>${escapeHTML(person.shelterName)}</td>

                <td>${person.beds.map(b => b.room).join(", ")}</td>

                <td>${person.beds.map(b => b.bed).join(", ")}</td>

                <td>${person.status}</td>

                <td>${timerText}</td>

            </tr>

        `;

    });

}


// ==========================================
// 5 HOUR COUNTDOWN
// ==========================================

function getRemainingTime(expiry) {

    let remaining = expiry - Date.now();

    if (remaining <= 0) {

        return "Expired";

    }

    let hours = Math.floor(remaining / 3600000);

    let minutes = Math.floor(
        (remaining % 3600000) / 60000
    );

    let seconds = Math.floor(
        (remaining % 60000) / 1000
    );


    return (

        String(hours).padStart(2, "0") + ":" +

        String(minutes).padStart(2, "0") + ":" +

        String(seconds).padStart(2, "0")

    );

}


// UPDATE ALL TIMERS AND RELEASE EXPIRED BEDS

function updateTimers() {

    let changed = false;

    registrations.forEach(person => {

        if (
            person.status === "Reserved" &&
            Date.now() >= person.expiresAt
        ) {

            person.status = "Expired";

            changed = true;

        }

    });


    if (changed) {

        saveData();

        updateDashboard();

        renderShelters();

    }


    renderRecords();

    let latest = registrations[registrations.length - 1];

    if (latest && latest.status === "Reserved") {

        updateSingleTimer(latest);

    }

}


// INDIVIDUAL TIMER

function updateSingleTimer(person) {

    let timer = document.getElementById("allocationTimer");

    if (!timer) return;

    if (person.status !== "Reserved") {

        timer.innerText = "RESERVATION EXPIRED";

        return;

    }

    timer.innerText = getRemainingTime(person.expiresAt);

}


// ==========================================
// ADD NEW SHELTER
// ==========================================

document.getElementById("shelterForm")
    .addEventListener("submit", function(e) {

        e.preventDefault();


        let selectedName =
            document.getElementById("newShelterName").value;


        let shelterName = selectedName === "Custom Shelter"
            ? document.getElementById("customShelterName").value.trim()
            : selectedName;


        let location =
            document.getElementById("newShelterLocation").value.trim();


        let category =
            document.getElementById("newShelterCategory").value;


        let rooms = Number(
            document.getElementById("newShelterRooms").value
        );


        if (!shelterName || !location || rooms < 1 || rooms > 100) {

            alert("Please enter valid shelter details.");

            return;

        }


        let duplicate = shelters.some(s =>
            s.name.toLowerCase() === shelterName.toLowerCase()
        );

        if (duplicate) {

            alert("A shelter with this name already exists.");

            return;

        }


        shelters.push({

            id: Date.now(),

            name: shelterName,

            location: location,

            category: category,

            rooms: rooms,

            bedsPerRoom: 50

        });


        saveData();

        updateDashboard();

        renderShelters();

        this.reset();

        document.getElementById("customNameField")
            .classList.add("hidden");

        showToast("New shelter successfully added.");

    });


// CUSTOM SHELTER NAME

document.getElementById("newShelterName")
    .addEventListener("change", function() {

        document.getElementById("customNameField")
            .classList.toggle(
                "hidden",
                this.value !== "Custom Shelter"
            );

    });


// ==========================================
// TERMS MODAL
// ==========================================

function openTerms() {

    document.getElementById("termsModal").style.display = "flex";

}

function closeTerms() {

    document.getElementById("termsModal").style.display = "none";

}


// ==========================================
// NOTIFICATION
// ==========================================

function showToast(message) {

    let toast = document.getElementById("toast");

    toast.innerText = message;

    toast.style.display = "block";

    setTimeout(() => {

        toast.style.display = "none";

    }, 3500);

}


// ESCAPE USER INPUT FOR HTML DISPLAY

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[character]);

}


// ==========================================
// DATE
// ==========================================

document.getElementById("currentDate").innerText =
    new Date().toLocaleDateString("en-IN", {

        day: "numeric",

        month: "long",

        year: "numeric"

    });


// ==========================================
// INITIALIZE SYSTEM
// ==========================================

generateFamilyFields();

updateDashboard();

renderShelters();

renderRecords();

updateTimers();


// UPDATE EVERY SECOND

setInterval(updateTimers, 1000);