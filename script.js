const scannedData = new Map();

function onScanSuccess(qrCodeMessage) {
    if (scannedData.has(qrCodeMessage)) {
        alert("⚠️ Sredstvo je već skenirano!");
        return;
    }
    
    alert("✅ Uspješno skenirano!");
    const dataFields = extractDataFields(qrCodeMessage);
    scannedData.set(qrCodeMessage, dataFields);
    document.getElementById("scanned-list").innerHTML += `<li>${qrCodeMessage}</li>`;
}

function extractDataFields(qrText) {
    const dataFields = {};
    qrText.split(';').forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
            dataFields[key] = value;
        }
    });
    return dataFields;
}

function sendFormattedEmail() {
    if (scannedData.size === 0) {
        alert("⚠️ Nema podataka za slanje!");
        return;
    }
    
    let emailBody = "Popis skeniranih QR kodova:%0A%0A";
    emailBody += "QR Kod\tT\tS\tP%0A"; // Zaglavlje s tabovima za lakše kopiranje u Excel
    
    scannedData.forEach((dataFields, qrCode) => {
        let row = `${qrCode}\t`; // QR kod u prvoj ćeliji
        row += `${dataFields['T'] || ''}\t`; // Tip (T)
        row += `${dataFields['S'] || ''}\t`; // SSID (S)
        row += `${dataFields['P'] || ''}\t`; // Password (P)
        emailBody += row + "%0A";
    });
    
    emailBody += "%0A(Samo kopirajte i zalijepite u Excel!)";
    
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=&su=Skenirani QR Kodovi&body=${emailBody}`;
    
    window.open(gmailUrl, "_blank"); // Otvara Gmail u novom tabu
}

function generateExcelFile() {
    if (scannedData.size === 0) {
        alert("⚠️ Nema podataka za generisanje Excel fajla!");
        return;
    }

    // Kreiraj zaglavlje
    const headers = ["QR Kod", "T", "S", "P"];
    const rows = [];

    scannedData.forEach((dataFields, qrCode) => {
        rows.push([
            qrCode,
            dataFields['T'] || '',
            dataFields['S'] || '',
            dataFields['P'] || ''
        ]);
    });

    // Kreiraj radni list i dodaj podatke
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Skenirani QR Kodovi");

    // Generiši Excel fajl i preuzmi ga
    XLSX.writeFile(wb, "skenirani_qr_kodovi.xlsx");
}

const qrCodeReader = new Html5Qrcode("reader");
function startScanner() {
    qrCodeReader.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: 300 },
        onScanSuccess
    ).catch(err => {
        alert("❌ Greška pri pokretanju kamere: " + err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    localStorage.clear(); // Brisanje keša pri osvježavanju stranice
    startScanner();
    
    // Dodaj dugme za slanje e-maila
    const sendEmailButton = document.createElement("button");
    sendEmailButton.textContent = "📨 Pošalji e-mail";
    sendEmailButton.classList.add("bg-blue-500", "text-white", "px-4", "py-2", "rounded-lg", "hover:bg-blue-600");
    sendEmailButton.onclick = sendFormattedEmail;
    
    document.body.appendChild(sendEmailButton);

    // Dodaj dugme za generisanje Excel fajla
    const generateExcelButton = document.createElement("button");
    generateExcelButton.textContent = "📥 Preuzmi Excel";
    generateExcelButton.classList.add("bg-green-500", "text-white", "px-4", "py-2", "rounded-lg", "hover:bg-green-600");
    generateExcelButton.onclick = generateExcelFile;

    document.body.appendChild(generateExcelButton);
});
