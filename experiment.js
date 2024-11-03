// Creating a captcha-check
let captchaPassed = false;
let attempts = 0;
const maxAttempts = 3;
let participantData = {}; // Declare globally

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

// Countdown timer logic
function startCountdown(duration) {
    let timer = duration;
    const countdownElement = document.getElementById("countdown");

    const interval = setInterval(() => {
        // Calculate minutes and seconds
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;

        // Update the countdown text
        countdownElement.textContent = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

        // Decrement the timer
        timer--;

        // Check if the timer has reached zero
        if (timer < 0) {
            clearInterval(interval); // Stop the countdown
        }

    }, 1000); // Update every second
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

    // Scroll to the top of the page
    window.scrollTo(0, 0);
});

// Håndtere innlevering av skjema for metadata
document.getElementById("participant-form").addEventListener("submit", function(event) {
    event.preventDefault();

    // Samle deltakerinfo og starte eksperimentet
    participantData.age = document.getElementById("age").value;
    participantData.gender = document.getElementById("gender").value;
    participantData.enhet = document.getElementById("enhet").value;
    participantData.audioOutput = document.getElementById("audio-output").value;
    participantData.inputDevice = document.getElementById("input").value;
    participantData.hearingImpairment = document.getElementById("hearing-impairment").value;
    participantData.computerFamiliarity = document.getElementById("datavandt").value;
    participantData.previousStudy = document.getElementById("tidligere-studie").value;
    participantData.responseTimes = [];

    // Skjul velkomstskjerm og vis test-skjerm
    document.querySelector(".metadata-screen").style.display = "none";
    document.querySelector(".experiment-screen").style.display = "block";
    loadTextContent();

    // Scroll to the top of the page
    window.scrollTo(0, 0);

    // Start the countdown timer (e.g., for 10 minutes)
    const readingDuration = 8 * 60; // 8 minutes in seconds
    startCountdown(readingDuration);

    setTimeout(() => {
        startNotifications(participantData);
    }, 500);
})

function startNotifications(participantData) {

    let notificationCount = 0;
    const maxNotifications = 20; // 10 with sound, 10 without sound
    const notificationsWithSound = Array(10).fill(true); // Array or 10, 'true' for sound
    const notificationsWithoutSound = Array(10).fill(false); // Array of 10, 'false' for sound
    const notificationTypes = [...notificationsWithSound, ...notificationsWithoutSound];

    // Shuffle the notificationTypes array to randomize the order
    notificationTypes.sort(() => Math.random() - 0.5);

    // Calculations
    const totalDuration = 8 * 60 * 1000; // 8 minutes
    const minInterval = 5 * 1000; // 5 seconds
    const maxInterval = 30 * 1000 // 30 seconds

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
    showNotification();
}




function showPostTestScreen() {
    document.querySelector(".experiment-screen").style.display = "none";
    document.querySelector(".post-test-screen").style.display = "block";

    // Scroll to the top of the page
    window.scrollTo(0, 0);
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
    document.getElementById("download-button").addEventListener("click", downloadData);

    // Scroll to the top of the page
    window.scrollTo(0, 0);
}

function downloadData() {
    // Convert the participantData object to a JSON string
    const dataStr = JSON.stringify(participantData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement("a");
    a.href = url;
    a.download = "participantData.json"; // File name
    a.click(); // Trigger the download

    // Clean up the URL object
    URL.revokeObjectURL(url);
}


