// Creating a captcha-check
let captchaPassed = false;
let attempts = 0;
const maxAttempts = 3;
let participantData = {}; // Declare globally
let responseTimes = [];

// Funksjon for å spille av testlyden
function playTestSound() {
    const audio = document.getElementById("test-sound");
    audio.play();
}

function playCaptchaSound() {
    // Choose a random sound file and set the source
    const audio = document.getElementById("captcha-sound")
    const sounds = [
        "assets/cow-moo.wav",
        "assets/dog-bark.wav",
        "assets/lion-roar.wav"
    ];

    const chosenSound = sounds[Math.floor(Math.random() * sounds.length)];
    audio.src = chosenSound;
    audio.play().catch((error) => (
        console.error("Feil ved lydavspilling: ", error)
    ));

    // Store the correct answer in a variable (e.g. cow, lion, dog)
    window.correctAnswer = chosenSound.includes("cow") ? "ku" : chosenSound.includes("dog") ? "hund" : "løve";
}

function verifyCaptcha() {
    // Get the user's answer from the text input
    const userAnswer = document.getElementById("sound-captcha-input").value.toLowerCase().trim();

    if (userAnswer === window.correctAnswer) {
        alert("Riktig! Du kan fortsette.")
        captchaPassed = true;
    } else {
        attempts++;
        alert("Feil. Prøv igjen.");
        if (attempts >= maxAttempts) {
            alert("Du har brukt opp alle forsøkene dine.");
            document.getElementById("sound-captcha-input").disabled = true;
        }
    }
}

// Funksjon for å laste tekstinnhold
function loadTextContent() {
    fetch('assets/sjokoladens-historie.html')
        .then(response => response.text())
        .then(text => {
            document.getElementById('history-of-chocolate').innerHTML = text;
        })
        .catch(error => console.error('Feil av lasting av dokument: ', error));
}

// Håndtere klikk på knapp på første skjerm (samtykke)
document.getElementById("consent-button").addEventListener("click", function() {
    const gdprConsent = document.getElementById("gdpr-consent");

    // Sjekker om GDPR-samtykke er gitt
    if (!gdprConsent.checked) {
        alert("Du må godta GDPR-vilkårene for å fortsette.");
        return;
    }

    // Sjekker om CAPTCHA er bestått
    if (!captchaPassed) {
        alert("Du må bestå CAPTCHA-en for å fortsette.");
        return;
    }

    // Skjul velkomstskjermen og vis metadata-skjermen
    document.querySelector(".welcome-screen").style.display = "none";
    document.querySelector(".metadata-screen").style.display = "block";
});

// Håndtere innlevering av skjema for metadata
document.getElementById("participant-form").addEventListener("submit", function(event) {
    event.preventDefault();

    // Samle deltakerinfo og starte eksperimentet
    participantData.age = document.getElementById("age").value;
    participantData.gender = document.getElementById("gender").value;
    participantData.audioOutput = document.getElementById("audio-output").value;
    participantData.inputDevice = document.getElementById("input-device").value;
    participantData.hearingImpairment = document.getElementById("hearing-impairment").value;
    participantData.computerFamiliarity = document.getElementById("computer-familiarity").value;
    participantData.previousStudy = document.getElementById("previous-study").value;

    // Skjul velkomstskjerm og vis test-skjerm
    document.querySelector(".metadata-screen").style.display = "none";
    document.querySelector(".experiment-screen").style.display = "block";
    loadTextContent();

    setTimeout(() => {
        startNotifications(participantData);
    }, 500);


})

function startNotifications(participantData) {
    let notificationCount = 0;
    const maxNotifications = 2; // 1 with sound, 1 without sound for testing
    const notificationsWithSound = [true]; // One notification with sound
    const notificationsWithoutSound = [false]; // One notification without sound
    const notificationTypes = [...notificationsWithSound, ...notificationsWithoutSound];

    // Shuffle the notificationTypes array to randomize the order
    notificationTypes.sort(() => Math.random() - 0.5);

    // Set intervals to ensure the test version doesn't take long
    const intervals = [5000, 5000]; // Both notifications will be spaced 5 seconds apart

    function showNotification() {

        const withSound = notificationTypes[notificationCount];
        notificationCount++;
        const notificationStart = Date.now();

        if (withSound) {
            const audio = new Audio("assets/notification-alert.wav");
            audio.preload = "auto";
            audio.currentTime = 0;
            audio.play();

            // Add a tiny delay before showing the alert, so the sound and alert are perceived together
            setTimeout(() => {
                alert("Klikk OK for å lukke notifikasjonen.");
                const responseTime = Date.now() - notificationStart;
                responseTimes.push({ withSound, responseTime });
            }, 50); // Delay by 50 milliseconds to sync better with the sound

            if (notificationCount >= maxNotifications) {
                showPostTestScreen();
                return;
            }

        } else {
            alert("Klikk OK for å lukke notifikasjonen.");
            const responseTime = Date.now() - notificationStart;
            participantData.responseTimes.push({ withSound, responseTime });

            if (notificationCount >= maxNotifications) {
                showPostTestScreen();
                return;
            }
        }
        // Schedule the next notification
        if (notificationCount < maxNotifications) {
            setTimeout(showNotification, intervals[notificationCount - 1]);
        }
    }
    // The first notification
    setTimeout(showNotification, intervals[0]);
}

/*
function startNotifications(participantData) {

    let notificationCount = 0;
    const maxNotifications = 20; // 10 with sound, 10 without sound
    const notificationsWithSound = Array(10).fill(true); // Array or 10, 'true' for sound
    const notificationsWithoutSound = Array(10).fill(false); // Array of 10, 'false' for sound
    const notificationTypes = [...notificationsWithSound, ...notificationsWithoutSound];

    // Shuffle the notificationTypes array to randomize the order
    notificationTypes.sort(() => Math.random() - 0.5);

    // Calculations
    const totalDuration = 10 * 60 * 1000; // 10 minutes
    const minInterval = 5 * 1000; // 5 seconds
    const maxInterval = 45 * 1000 // 45 seconds

    // Generate random intervals that sum up to the total duration
    const intervals = [];
    let remainingTime = totalDuration;

    for (let i = 0; i < maxNotifications -1; i++) {
        const maxPossibleInterval = Math.min(maxInterval, remainingTime - (minInterval * (maxNotifications -1 - i)));
        const interval = Math.random() * (maxPossibleInterval - minInterval) + minInterval;
        intervals.push(interval);
        remainingTime -= interval;
    }
    intervals.push(remainingTime);


    function showNotification() {
        if (notificationCount >= maxNotifications) {
            showPostTestScreen();
            return;
        }

        const withSound = notificationTypes[notificationCount];
        notificationCount++;
        const notificationStart = Date.now();

        if (withSound) {
            const audio = new Audio("assets/notification-alert.wav");
            audio.preload = "auto";
            audio.currentTime = 0;
            audio.play();

            // Add a tiny delay before showing the alert, so the sound and alert are perceived together
            setTimeout(() => {
                alert("Klikk OK for å lukke notifikasjonen.");
                const responseTime = Date.now() - notificationStart;
                participantData.responseTimes.push({ withSound, responseTime });
            }, 50); // Delay by 50 milliseconds to sync better with the sound
        } else {
            alert("Klikk OK for å lukke notifikasjonen.");
            const responseTime = Date.now() - notificationStart;
            participantData.responseTimes.push({ withSound, responseTime });
        }
        // Schedule the next notification
        if (notificationCount < maxNotifications) {
            setTimeout(showNotification, intervals[notificationCount - 1]);
        }
    }
    // The first notification
    showNotification();
}
 */



function showPostTestScreen() {
    document.querySelector(".experiment-screen").style.display = "none";
    document.querySelector(".post-test-screen").style.display = "block";
}

// Event listener for submitting the question form
document.getElementById("question-form").addEventListener("submit", function(event) {
    event.preventDefault();

    participantData.question1 = document.querySelector('input[name="question1"]:checked').value;
    participantData.question2 = document.querySelector('input[name="question2"]:checked').value;
    participantData.question3 = document.querySelector('input[name="question3"]:checked').value;
    participantData.engagement = document.querySelector('input[name="engagement"]:checked').value;
    participantData.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    participantData.distraction = document.querySelector('input[name="distraction"]:checked').value;

    endExperiment(participantData);
});


function endExperiment(participantData) {
    // Log the participant data to the console
    console.log("Collected Participant Data:", participantData);

    // Skjul testskjermen og vis avslutningsskjermen
    document.querySelector(".post-test-screen").style.display = "none";
    document.querySelector(".end-screen").style.display = "block";
}


// Replace 'YOUR_SCRIPT_URL' with your Web App URL
fetch('https://script.google.com/macros/s/AKfycbyS3r2LpM2nXLHY4SfNG9PvMzXIC6hrUiSjglmmGRspeGRxs0SwOStO4iB7am_Iv9RMag/exec', {
    method: 'POST',
    body: JSON.stringify(participantData),
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.text())
.then(data => {
    console.log('Success:', data);
})
.catch((error) => {
    console.error('Error:', error);
});
